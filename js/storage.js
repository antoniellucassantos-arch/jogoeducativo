// =========================================================================
// DADOS SALVOS NO TOTEM (localStorage)
// jogadores, ranking, alunos cadastrados, perguntas e anúncios extras
// =========================================================================

const Dados = {
    P: 'eduQuest_',

    ler(chave, padrao) {
        try { const v = localStorage.getItem(this.P + chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
    },
    salvar(chave, valor) {
        try { localStorage.setItem(this.P + chave, JSON.stringify(valor)); return true; }
        catch (e) { console.warn('Não foi possível salvar', chave, e); return false; }
    },
    apagar(chave) { try { localStorage.removeItem(this.P + chave); } catch (e) {} },

    hoje() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    // semana começa na segunda-feira
    semana() {
        const d = new Date(); d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    // ---------- jogadores ----------
    lista() { return this.ler('jogadores', []); },

    jogador(matricula) {
        const j = this.ler('jogador_' + matricula, null);
        if (!j) return null;
        // compatível com a versão antiga (level/xp separados)
        if (j.level && j.xp !== undefined && j.xpTotal === undefined) {
            j.xpTotal = Niveis.xpAte(j.level) + j.xp;
        }
        j.respondidas = j.respondidas || {};
        j.acertos = j.acertos || {}; j.erros = j.erros || {};
        if (!j.hoje || j.hoje.data !== this.hoje()) j.hoje = { data: this.hoje(), respondidas: 0, profs: [], xp: 0 };
        if (!j.semana || j.semana.id !== this.semana()) j.semana = { id: this.semana(), xp: 0 };
        return j;
    },

    novoJogador(matricula) {
        const aluno = this.alunos()[matricula];
        return {
            matricula, nome: aluno ? aluno.nome : '', turma: aluno ? aluno.turma : '',
            avatar: null, xpTotal: 0, criadoEm: this.hoje(),
            hoje: { data: this.hoje(), respondidas: 0, profs: [], xp: 0 },
            semana: { id: this.semana(), xp: 0 },
            respondidas: {}, acertos: {}, erros: {}, dias: [],
        };
    },

    salvarJogador(j) {
        const aluno = this.alunos()[j.matricula];
        if (aluno) { j.nome = aluno.nome; j.turma = aluno.turma; }
        this.salvar('jogador_' + j.matricula, j);
        const l = this.lista();
        if (!l.includes(j.matricula)) { l.push(j.matricula); this.salvar('jogadores', l); }
    },

    todos() { return this.lista().map(m => this.jogador(m)).filter(Boolean); },

    // tipo: 'geral' | 'semana'
    ranking(tipo = 'geral', turma = null) {
        let l = this.todos();
        if (turma) l = l.filter(j => j.turma === turma);
        const pontos = j => tipo === 'semana' ? j.semana.xp : j.xpTotal;
        return l.filter(j => pontos(j) > 0).sort((a, b) => pontos(b) - pontos(a)).map(j => ({ ...j, pontos: pontos(j) }));
    },

    posicao(matricula, tipo = 'geral') {
        const i = this.ranking(tipo).findIndex(j => j.matricula === matricula);
        return i < 0 ? null : i + 1;
    },

    nomeExibicao(j) {
        if (j.nome) {
            const p = j.nome.trim().split(/\s+/);
            return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
        }
        const m = String(j.matricula);
        return 'Aluno •••' + m.slice(-4);
    },

    // ---------- alunos cadastrados (importados no painel) ----------
    alunos() { return this.ler('alunos', {}); },
    salvarAlunos(a) { return this.salvar('alunos', a); },

    // ---------- conteúdo extra (painel) ----------
    perguntasExtras() { return this.ler('perguntasExtras', []); },
    salvarPerguntasExtras(l) { return this.salvar('perguntasExtras', l); },
    anunciosExtras() { return this.ler('anunciosExtras', []); },
    salvarAnunciosExtras(l) { return this.salvar('anunciosExtras', l); },

    // ---------- backup ----------
    exportar() {
        const out = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k.startsWith(this.P)) out[k] = localStorage.getItem(k);
        }
        return out;
    },
    importar(obj) {
        Object.entries(obj).forEach(([k, v]) => { if (k.startsWith(this.P)) localStorage.setItem(k, v); });
    },
    apagarJogadores() {
        this.lista().forEach(m => this.apagar('jogador_' + m));
        this.apagar('jogadores');
    },
};

// =========================================================================
// NÍVEIS E TÍTULOS
// =========================================================================
const Niveis = {
    titulos: ['Calouro', 'Aprendiz', 'Estudante', 'Esforçado', 'Dedicado', 'Destaque', 'Veterano', 'Monitor', 'Mestre', 'Sábio', 'Lenda do IF'],
    xpParaSubir(n) { return 100 + (n - 1) * 50; },
    xpAte(n) { let t = 0; for (let i = 1; i < n; i++) t += this.xpParaSubir(i); return t; },
    de(xpTotal) {
        let n = 1, resto = xpTotal;
        while (resto >= this.xpParaSubir(n)) { resto -= this.xpParaSubir(n); n++; }
        return { nivel: n, xp: resto, falta: this.xpParaSubir(n), titulo: this.titulos[Math.min(n - 1, this.titulos.length - 1)] };
    },
};
