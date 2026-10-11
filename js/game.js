// =========================================================================
// O JOGO: estados, teclado e o fluxo (anúncio → login → mapa → desafio)
// =========================================================================

const TECLAS = {
    cima: ['Numpad8', 'ArrowUp', 'KeyW'], baixo: ['Numpad2', 'ArrowDown', 'KeyS'],
    esq: ['Numpad4', 'ArrowLeft', 'KeyA'], dir: ['Numpad6', 'ArrowRight', 'KeyD'],
    enter: ['Enter', 'NumpadEnter'], acao: ['Numpad5', 'Space', 'KeyE'],
    apagar: ['NumpadDecimal', 'Backspace', 'Delete', 'NumpadComma'],
    voltar: ['NumpadSubtract', 'Escape', 'Minus'],
};
const DIR_DA_TECLA = { cima: 'up', baixo: 'down', esq: 'left', dir: 'right' };

function acaoDe(code) {
    for (const [a, l] of Object.entries(TECLAS)) if (l.includes(code)) return a;
    return null;
}
function digitoDe(code) {
    const m = /^(?:Numpad|Digit)(\d)$/.exec(code);
    return m ? m[1] : null;
}

const REACOES = {
    acerto: ['Mandou muito bem!', 'Excelente! É isso aí!', 'Perfeito! Continue assim.', 'Muito bom! Dá pra ver que você estudou.'],
    erro: ['Não foi dessa vez... mas errar faz parte de aprender!', 'Quase! Revise esse conteúdo e tente de novo amanhã.', 'Hmm, não era essa. Leia a explicação com calma!'],
    tempo: ['O tempo acabou! Da próxima vez, confie no seu raciocínio.'],
};
const sortear = l => l[Math.floor(Math.random() * l.length)];

const Jogo = {
    estado: 'ANUNCIOS',
    jogador: null,
    teclas: { cima: false, baixo: false, esq: false, dir: false, ultima: null },
    ocioso: 0, avisoOcioso: 0,
    matricula: '', avatarIdx: 0,
    desafio: null, prof: null, trocando: false,

    iniciar() {
        Mundo.init();
        PERGUNTAS.carregarExtras();
        ajustarTela();
        window.addEventListener('resize', ajustarTela);
        window.addEventListener('keydown', e => this.keydown(e));
        window.addEventListener('keyup', e => this.keyup(e));
        this.ligarToque();
        this.irAnuncios();
        let ultimo = performance.now();
        const loop = t => {
            const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
            this.atualizar(dt);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    },

    mudarEstado(e) {
        this.estado = e;
        document.getElementById('app').dataset.estado = e;
        if (e !== 'JOGO') Object.assign(this.teclas, { cima: false, baixo: false, esq: false, dir: false });
        this.atualizarTecladoVirtual();
    },

    // ---------- ajudantes ----------
    lookDe(j) { return AVATARES[((j && j.avatar) || 0) % AVATARES.length]; },
    jogadorLook() { return this.jogador ? this.lookDe(this.jogador) : AVATARES[0]; },
    professorFeitoHoje(id) { return !!(this.jogador && this.jogador.hoje.profs.includes(id)); },
    nomeProf(p) { return (p.look.genero === 'f' ? 'Profª ' : 'Prof. ') + p.nome; },
    limiteAtingido() { return this.jogador && this.jogador.hoje.respondidas >= CONFIG.limiteDiario; },

    // ---------- loop ----------
    atualizar(dt) {
        if (this.estado !== 'ANUNCIOS') {
            const contando = !(this.estado === 'DESAFIO' && CONFIG.tempoPergunta > 0);
            if (contando) this.ocioso += dt;
            if (!this.avisoOcioso && this.ocioso > CONFIG.tempoOcioso) this.mostrarAvisoOcioso();
            if (this.avisoOcioso) {
                const resta = Math.ceil(10 - (this.ocioso - CONFIG.tempoOcioso));
                $('modal-texto').innerHTML = `Voltando para o início em <b>${Math.max(0, resta)}</b>...`;
                if (resta <= 0) { this.avisoOcioso = 0; UI.esconder('modal'); this.sair(true); }
            }
        }
        const mover = this.estado === 'JOGO' && !this.trocando && !this.avisoOcioso;
        Mundo.atualizar(dt, mover ? this.teclas : null);
        Mundo.desenhar();
    },

    mostrarAvisoOcioso() {
        this.avisoOcioso = 1;
        UI.modal('AINDA ESTÁ AÍ?', '', '<span>Aperte qualquer tecla para continuar</span>');
    },

    // =====================================================================
    // TECLADO
    // =====================================================================
    keydown(e) {
        const code = e.code;
        if (/^(Arrow|Numpad|Space)/.test(code) || code === 'Backspace') e.preventDefault();
        if (document.getElementById('admin').classList.contains('oculto') === false) return;
        Som.iniciar();
        this.ocioso = 0;
        if (this.avisoOcioso) { this.avisoOcioso = 0; UI.esconder('modal'); if (this.estado === 'SAIR') UI.modal(...this.textoSair()); return; }

        const a = acaoDe(code), d = digitoDe(code);
        if (DIR_DA_TECLA[a] && this.estado === 'JOGO') {
            this.teclas[a] = true; this.teclas.ultima = DIR_DA_TECLA[a];
            return;
        }
        if (e.repeat) return;
        this.tecla(a, d, code);
    },

    keyup(e) {
        const a = acaoDe(e.code);
        if (DIR_DA_TECLA[a]) {
            this.teclas[a] = false;
            const ainda = Object.keys(DIR_DA_TECLA).find(k => this.teclas[k]);
            this.teclas.ultima = ainda ? DIR_DA_TECLA[ainda] : null;
        }
    },

    // Também é chamado pelos cliques/toques (com um texto tipo '1', 'enter', 'voltar')
    tecla(a, d = null, code = '') {
        if (a && /^\d$/.test(a)) { d = a; a = null; }
        const ok = a === 'enter' || a === 'acao';
        switch (this.estado) {
            case 'ANUNCIOS':
                if (ok || d !== null) { Som.inicio(); this.irLogin(d); }
                break;

            case 'LOGIN':
                if (d !== null) {
                    if (this.matricula.length < 14) { this.matricula += d; Som.mover(); this.desenharMatricula(); }
                } else if (a === 'apagar') { this.matricula = this.matricula.slice(0, -1); Som.voltar(); this.desenharMatricula(); }
                else if (a === 'voltar') { Som.voltar(); this.irAnuncios(); }
                else if (a === 'enter') this.confirmarLogin();
                break;

            case 'AVATAR':
                if (a === 'esq' || a === 'dir' || d === '4' || d === '6') {
                    const passo = (a === 'esq' || d === '4') ? -1 : 1;
                    this.avatarIdx = (this.avatarIdx + passo + AVATARES.length) % AVATARES.length;
                    Som.mover(); this.desenharAvatar();
                } else if (ok) { Som.ok(); this.jogador.avatar = this.avatarIdx; Dados.salvarJogador(this.jogador); this.comecarJogo(); }
                else if (a === 'voltar') { Som.voltar(); this.irAnuncios(); }
                break;

            case 'JOGO':
                if (ok) this.interagir();
                else if (d === '0' || a === 'voltar') this.pedirSaida();
                break;

            case 'DIALOGO':
                if (Dialogo.opcoes && Dialogo.completo) {
                    if (['1', '2', '3'].includes(d)) { Som.ok(); this.escolherDificuldade(+d); }
                    else if (d === '0' || a === 'voltar' || a === 'apagar') { Som.voltar(); Dialogo.fechar(); this.mudarEstado('JOGO'); }
                } else if (ok || d === '0' || a === 'voltar') Dialogo.avancar();
                break;

            case 'DESAFIO':
                if (['1', '2', '3', '4'].includes(d) && +d <= this.desafio.q.opcoes.length) this.responder(+d - 1);
                break;

            case 'RESULTADO':
                if (ok) this.fecharResultado();
                break;

            case 'NIVEL':
                if (ok) { UI.esconder('tela-nivel'); this.reacaoProfessor(); }
                break;

            case 'RESUMO':
                if (ok) this.irAnuncios();
                break;

            case 'SAIR':
                if (d === '0' || a === 'voltar') { UI.esconder('modal'); this.sair(); }
                else if (ok) { Som.voltar(); UI.esconder('modal'); this.mudarEstado('JOGO'); }
                break;
        }
    },

    // =====================================================================
    // TELAS
    // =====================================================================
    esconderTudo() {
        UI.esconder('tela-anuncios', 'tela-login', 'tela-avatar', 'tela-desafio', 'tela-nivel', 'tela-resumo', 'hud', 'dica', 'modal', 'dialogo', 'resultado');
        Dialogo.fechar();
        clearInterval(this.timerDesafio); clearTimeout(this.timerResumo);
    },

    irAnuncios() {
        this.esconderTudo();
        this.mudarEstado('ANUNCIOS');
        this.jogador = null; this.desafio = null; this.avisoOcioso = 0;
        Mundo.demo = true; Mundo.jogador = null;
        Mundo.carregar('patio', INICIO, 'down');
        UI.mostrar('tela-anuncios');
        Anuncios.iniciar();
    },

    irLogin(primeiroDigito = null) {
        Anuncios.parar();
        this.esconderTudo();
        this.mudarEstado('LOGIN');
        this.matricula = primeiroDigito || '';
        $('login-msg').textContent = ' '; $('login-msg').className = '';
        this.desenharMatricula();
        UI.mostrar('tela-login');
    },

    desenharMatricula() {
        const m = this.matricula;
        $('matricula-display').innerHTML = [...m].map(c => `<div class="dig">${c}</div>`).join('') + (m.length < 14 ? '<div class="dig cursor"></div>' : '');
    },

    erroLogin(msg) {
        Som.erroTecla();
        const el = $('login-msg');
        el.textContent = msg; el.className = ''; void el.offsetWidth; el.className = 'erro';
    },

    confirmarLogin() {
        const m = this.matricula;
        if (m.length < CONFIG.digitosMatricula) return this.erroLogin(m ? `A matrícula precisa ter pelo menos ${CONFIG.digitosMatricula} números` : 'Digite sua matrícula!');
        const alunos = Dados.alunos();
        if (CONFIG.somenteAlunosCadastrados && Object.keys(alunos).length && !alunos[m]) return this.erroLogin('Matrícula não encontrada. Fale com a coordenação.');

        let j = Dados.jogador(m);
        const novo = !j;
        if (!j) j = Dados.novoJogador(m);
        this.jogador = j;
        Som.ok();

        if (this.limiteAtingido()) return this.mostrarResumo('VOLTE AMANHÃ!', `Você já fez seus ${CONFIG.limiteDiario} desafios de hoje. Amanhã tem mais!`);
        if (novo || j.avatar === null || j.avatar === undefined) {
            Dados.salvarJogador(j);
            return this.irAvatar();
        }
        Dados.salvarJogador(j);
        this.comecarJogo();
    },

    irAvatar() {
        this.esconderTudo();
        this.mudarEstado('AVATAR');
        this.avatarIdx = Math.floor(Math.random() * AVATARES.length);
        $('avatar-lista').innerHTML = AVATARES.map((a, i) => `<img data-i="${i}" src="${Sprites.personagemURL(a, 'down', 3)}" alt="">`).join('');
        $('avatar-lista').querySelectorAll('img').forEach(img => img.onclick = () => { this.avatarIdx = +img.dataset.i; this.desenharAvatar(); });
        this.desenharAvatar();
        UI.mostrar('tela-avatar');
        clearInterval(this.timerAvatar);
        let k = 0;
        this.timerAvatar = setInterval(() => {
            if (this.estado !== 'AVATAR') return clearInterval(this.timerAvatar);
            k++; $('avatar-img').src = Sprites.personagemURL(AVATARES[this.avatarIdx], ['down', 'left', 'up', 'right'][k % 4], 16);
        }, 900);
    },

    desenharAvatar() {
        $('avatar-img').src = Sprites.personagemURL(AVATARES[this.avatarIdx], 'down', 16);
        $('avatar-num').textContent = `${this.avatarIdx + 1} / ${AVATARES.length}`;
        $('avatar-lista').querySelectorAll('img').forEach((img, i) => img.classList.toggle('ativo', i === this.avatarIdx));
    },

    comecarJogo() {
        const j = this.jogador;
        const primeiraVez = !j.dias || !j.dias.length;
        if (!j.dias) j.dias = [];
        if (!j.dias.includes(Dados.hoje())) { j.dias.push(Dados.hoje()); if (j.dias.length > 60) j.dias.shift(); }
        Dados.salvarJogador(j);

        UI.fade(() => {
            this.esconderTudo();
            Mundo.demo = false; Mundo.jogador = null;
            Mundo.carregar(INICIO.mapa, INICIO, INICIO.dir);
            UI.hud(j);
            UI.mostrar('hud', 'dica');
            this.mudarEstado('JOGO');
        }).then(() => {
            UI.banner(MAPAS[INICIO.mapa].nome);
            const nome = j.nome ? j.nome.split(' ')[0] : 'estudante';
            const resta = CONFIG.limiteDiario - j.hoje.respondidas;
            if (primeiraVez) {
                this.falar({
                    nome: 'EDUQUEST', falas: [
                        `Bem-vindo(a) ao campus, ${nome}! Use 8, 4, 6 e 2 para andar.`,
                        'Os professores com um "!" em cima têm desafios para você. Chegue perto e aperte 5 ou ENTER.',
                        `Você pode fazer ${CONFIG.limiteDiario} desafios por dia. Desafios difíceis valem mais XP!`,
                        'Alguns professores estão no pátio, outros nas salas. Entre no prédio para encontrá-los. Boa sorte!',
                    ],
                });
            } else {
                this.falar({ nome: 'EDUQUEST', falas: [`Que bom te ver de novo, ${nome}! Você tem ${resta} desafio${resta > 1 ? 's' : ''} hoje.`] });
            }
        });
    },

    falar(opts) {
        this.mudarEstado('DIALOGO');
        const fim = opts.aoFim;
        Dialogo.abrir({ ...opts, aoFim: () => { this.mudarEstado('JOGO'); fim && fim(); } });
    },

    trocarMapa(id, dest, dir) {
        if (this.trocando) return;
        this.trocando = true;
        Som.porta();
        UI.fade(() => Mundo.carregar(id, dest, dir)).then(() => {
            this.trocando = false;
            UI.banner(MAPAS[id].nome);
        });
    },

    interagir() {
        const alvo = Mundo.alvoInteracao;
        if (!alvo) return;
        Som.ok();
        if (alvo.tipo === 'professor') return this.falarProfessor(alvo.npc);
        if (alvo.tipo === 'aluno') {
            alvo.npc.olharPara(Mundo.jogador); alvo.npc.alvo = null; alvo.npc.andando = false;
            return this.falar({ nome: 'COLEGA', retrato: Sprites.retratoURL(alvo.npc.look, 7), falas: [alvo.npc.fala] });
        }
        if (alvo.tipo === 'info') this.falar({ nome: '', falas: [alvo.obj.info] });
    },

    falarProfessor(npc) {
        const p = npc.prof;
        npc.olharPara(Mundo.jogador);
        this.prof = p;
        const base = { nome: this.nomeProf(p), cor: MATERIAS[p.materias[0]].cor, retrato: Sprites.retratoURL(p.look, 7) };
        if (this.professorFeitoHoje(p.id)) return this.falar({ ...base, falas: [p.falas.feito] });
        if (this.limiteAtingido()) return this.falar({ ...base, falas: ['Você já completou seus desafios de hoje. Volte amanhã que eu tenho mais!'] });

        const materias = p.materias.map(m => MATERIAS[m].nome).join(' e ');
        const opc = [1, 2, 3].map(d => `
            <div class="opcao-dif" data-tecla="${d}"><kbd>${d}</kbd><span class="estrelas">${'★'.repeat(d)}${'☆'.repeat(3 - d)}</span>
            <span>${['Fácil', 'Médio', 'Difícil'][d - 1]}</span><span class="xp">+${CONFIG.xp[d]} XP</span></div>`).join('')
            + `<div class="opcao-dif fraca" data-tecla="0"><kbd>0</kbd><span>Agora não</span></div>`;
        this.mudarEstado('DIALOGO');
        Dialogo.abrir({
            ...base,
            falas: [sortear(p.falas.ola), `Tenho um desafio de ${materias} para você. Qual nível você encara?`],
            opcoes: { html: opc },
        });
    },

    escolherDificuldade(dif) {
        Dialogo.fechar();
        const p = this.prof;
        const q = PERGUNTAS.sortear(p.materias, dif, this.jogador);
        if (!q) return this.falar({ nome: this.nomeProf(p), retrato: Sprites.retratoURL(p.look, 7), falas: ['Ainda estou preparando minhas perguntas. Volte mais tarde!'] });
        this.iniciarDesafio(p, q);
    },

    // =====================================================================
    // DESAFIO
    // =====================================================================
    iniciarDesafio(p, q) {
        const m = MATERIAS[q.materia];
        this.desafio = { p, q, inicio: performance.now(), respondido: false };
        const tela = $('tela-desafio');
        tela.style.setProperty('--cor-materia', m.cor);
        $('desafio-img').src = Sprites.retratoURL(p.look, 7);
        $('desafio-prof').textContent = this.nomeProf(p);
        $('desafio-materia').textContent = `${m.icone} ${m.nome}`;
        $('desafio-dif').innerHTML = '★'.repeat(q.dif) + '☆'.repeat(3 - q.dif) + `<small>${['Fácil', 'Médio', 'Difícil'][q.dif - 1]}</small>`;
        $('desafio-valor').textContent = CONFIG.xp[q.dif];
        const perg = $('pergunta');
        perg.textContent = q.texto;
        perg.className = 'px' + (q.texto.length > 160 ? ' muito-longa' : q.texto.length > 100 ? ' longa' : '');
        $('opcoes').innerHTML = q.opcoes.map((o, i) => `<div class="opcao${o.length > 70 ? ' longa' : ''}" data-i="${i}"><div class="tecla">${i + 1}</div><div>${esc(o)}</div></div>`).join('');
        $('opcoes').querySelectorAll('.opcao').forEach(el => el.onclick = () => this.estado === 'DESAFIO' && this.responder(+el.dataset.i));
        UI.esconder('resultado', 'dica');
        UI.mostrar('tela-desafio');
        this.mudarEstado('DESAFIO');

        // cronômetro
        const total = CONFIG.tempoPergunta;
        const barra = $('tempo-barra');
        document.querySelector('.tempo').classList.toggle('sem-limite', !total);
        clearInterval(this.timerDesafio);
        if (total) {
            barra.style.transition = 'none'; barra.style.width = '100%'; barra.className = '';
            $('tempo-num').textContent = total;
            void barra.offsetWidth; barra.style.transition = '';
            let ultimo = total;
            this.timerDesafio = setInterval(() => {
                const passou = (performance.now() - this.desafio.inicio) / 1000;
                const resta = Math.max(0, total - passou);
                barra.style.width = (resta / total * 100) + '%';
                barra.className = resta < total * 0.2 ? 'pouco' : resta < total * 0.5 ? 'medio' : '';
                const s = Math.ceil(resta);
                if (s !== ultimo) { ultimo = s; $('tempo-num').textContent = s; if (s <= 5 && s > 0) Som.tique(); }
                if (resta <= 0) this.responder(-1);
            }, 100);
        }
    },

    responder(i) {
        const D = this.desafio;
        if (!D || D.respondido) return;
        D.respondido = true;
        clearInterval(this.timerDesafio);
        const { q, p } = D;
        const segundos = (performance.now() - D.inicio) / 1000;
        const certo = i === q.correta;
        const j = this.jogador;
        const nivelAntes = Niveis.de(j.xpTotal).nivel;

        // pontos: base da dificuldade + bônus por rapidez (até metade do tempo)
        let ganho = 0, bonus = 0;
        if (certo) {
            ganho = CONFIG.xp[q.dif];
            const lim = (CONFIG.tempoPergunta || 60) * 0.5;
            bonus = Math.round(CONFIG.xp.bonusRapido * Math.max(0, 1 - segundos / lim));
        } else if (i >= 0) ganho = 5; // vale a tentativa

        const total = ganho + bonus;
        j.xpTotal += total; j.hoje.xp += total; j.semana.xp += total;
        j.hoje.respondidas++; j.hoje.profs.push(p.id);
        (j.respondidas[q.materia] = j.respondidas[q.materia] || []).push(q.id);
        const cont = certo ? j.acertos : j.erros;
        cont[q.materia] = (cont[q.materia] || 0) + 1;
        Dados.salvarJogador(j);
        D.resultado = { certo, tempo: i < 0, total, bonus, subiu: Niveis.de(j.xpTotal).nivel > nivelAntes };

        // marca as alternativas
        const els = $('opcoes').querySelectorAll('.opcao');
        if (i >= 0) els[i].classList.add('escolhida');
        setTimeout(() => {
            els.forEach((el, k) => {
                if (k === q.correta) el.classList.add('certa');
                else if (k === i) el.classList.add('errada');
                else el.classList.add('apagada');
            });
            certo ? Som.acerto() : Som.erro();
        }, 350);
        this.mudarEstado('RESPONDENDO');
        setTimeout(() => this.mostrarResultado(), 1500);
    },

    mostrarResultado() {
        const { q, resultado: r } = this.desafio;
        const t = $('resultado-titulo');
        t.textContent = r.certo ? 'ACERTOU!' : r.tempo ? 'TEMPO ESGOTADO' : 'NÃO FOI DESSA VEZ';
        t.className = r.certo ? 'bom' : 'ruim';
        $('resultado-xp').innerHTML = r.total
            ? `+${r.total} XP${r.bonus ? `<small>${r.total - r.bonus} do desafio + ${r.bonus} de bônus por rapidez</small>` : r.certo ? '' : '<small>pela tentativa</small>'}`
            : '+0 XP';
        const resposta = `<b>RESPOSTA: ${esc(q.certa)}</b>`;
        $('resultado-exp').innerHTML = resposta + esc(q.exp || '');
        UI.mostrar('resultado');
        this.mudarEstado('RESULTADO');
    },

    fecharResultado() {
        Som.ok();
        UI.esconder('tela-desafio', 'resultado');
        UI.mostrar('dica');
        UI.hud(this.jogador);
        if (this.desafio.resultado.subiu) {
            const n = Niveis.de(this.jogador.xpTotal);
            $('nivel-numero').textContent = n.nivel;
            $('nivel-titulo').textContent = n.titulo;
            confete();
            UI.mostrar('tela-nivel');
            Som.nivel();
            this.mudarEstado('NIVEL');
            return;
        }
        this.reacaoProfessor();
    },

    reacaoProfessor() {
        const { p, resultado: r } = this.desafio;
        const fala = sortear(r.certo ? REACOES.acerto : r.tempo ? REACOES.tempo : REACOES.erro);
        const falas = [fala];
        const fim = this.limiteAtingido();
        if (fim) falas.push('Esses foram seus desafios de hoje. Até amanhã!');
        this.falar({
            nome: this.nomeProf(p), cor: MATERIAS[p.materias[0]].cor, retrato: Sprites.retratoURL(p.look, 7), falas,
            aoFim: () => { if (fim) setTimeout(() => this.mostrarResumo(), 300); },
        });
    },

    // =====================================================================
    // SAIR / RESUMO
    // =====================================================================
    textoSair() {
        return ['SAIR DO JOGO?', 'Seu progresso já está salvo.', '<span><kbd>0</kbd> sair</span><span><kbd class="largo">ENTER</kbd> continuar</span>'];
    },
    pedirSaida() {
        Som.voltar();
        this.mudarEstado('SAIR');
        UI.modal(...this.textoSair());
    },

    sair(porInatividade = false) {
        const j = this.jogador;
        if (j && j.hoje.respondidas > 0 && !porInatividade) return this.mostrarResumo('ATÉ LOGO!', 'Seu progresso foi salvo. Volte sempre!');
        UI.fade(() => this.irAnuncios());
    },

    mostrarResumo(titulo = 'ATÉ AMANHÃ!', msg = null) {
        const j = this.jogador;
        this.esconderTudo();
        const n = Niveis.de(j.xpTotal);
        const pg = Dados.posicao(j.matricula, 'geral'), ps = Dados.posicao(j.matricula, 'semana');
        $('resumo-titulo').textContent = titulo;
        $('resumo-img').src = Sprites.personagemURL(this.lookDe(j), 'down', 10);
        $('resumo-nome').textContent = `${Dados.nomeExibicao(j)} · ${n.titulo}`;
        $('resumo-stats').innerHTML = `
            <div class="stat"><b>+${j.hoje.xp}</b><span>XP hoje</span></div>
            <div class="stat"><b>${n.nivel}</b><span>nível</span></div>
            <div class="stat"><b>${pg ? pg + 'º' : '-'}</b><span>no ranking geral</span></div>
            <div class="stat"><b>${ps ? ps + 'º' : '-'}</b><span>na semana</span></div>`;
        $('resumo-msg').textContent = msg || 'Você completou os desafios de hoje! Volte amanhã para ganhar mais XP.';
        UI.mostrar('tela-resumo');
        this.mudarEstado('RESUMO');
        this.timerResumo = setTimeout(() => { if (this.estado === 'RESUMO') this.irAnuncios(); }, 25000);
    },

    // =====================================================================
    // TOQUE (celular/tablet): teclado numérico na tela e cliques
    // =====================================================================
    ligarToque() {
        const params = new URLSearchParams(location.search);
        this.toque = params.has('teclado') || window.matchMedia('(pointer: coarse)').matches;
        const tv = $('teclado-virtual');
        const teclas = [['7'], ['8', 'seta'], ['9'], ['-', '', 'NumpadSubtract'], ['4', 'seta'], ['5'], ['6', 'seta'], ['.', '', 'NumpadDecimal'],
            ['1'], ['2', 'seta'], ['3'], ['ENTER', 'enter', 'NumpadEnter'], ['0', 'zero']];
        tv.innerHTML = teclas.map(([t, c, code]) => `<button class="${c || ''}" data-code="${code || 'Numpad' + t}">${t}</button>`).join('');
        tv.querySelectorAll('button').forEach(b => {
            const code = b.dataset.code;
            const solta = () => this.keyup({ code });
            b.addEventListener('pointerdown', e => { e.preventDefault(); this.keydown({ code, preventDefault() {}, repeat: false }); });
            b.addEventListener('pointerup', solta); b.addEventListener('pointerleave', solta); b.addEventListener('pointercancel', solta);
        });
        // tocar nas telas = ENTER
        const enter = () => this.keydown({ code: 'Enter', preventDefault() {}, repeat: false });
        ['tela-anuncios', 'resultado', 'tela-nivel', 'tela-resumo', 'dialogo'].forEach(id => $(id).addEventListener('click', e => {
            if (e.target.closest('[data-tecla]')) return;
            enter();
        }));
        $('modal').addEventListener('click', () => { if (this.estado === 'SAIR') this.tecla('enter'); else enter(); });
    },

    atualizarTecladoVirtual() {
        const mostrar = this.toque && ['JOGO', 'LOGIN', 'AVATAR'].includes(this.estado);
        $('teclado-virtual').classList.toggle('oculto', !mostrar);
        document.getElementById('app').classList.toggle('com-teclado', !!mostrar);
    },
};

// Ajusta o tamanho e a rotação para caber na tela
function ajustarTela() {
    const params = new URLSearchParams(location.search);
    let rot = params.has('rot') ? +params.get('rot') : CONFIG.rotacao;
    if (rot === 'auto') rot = window.innerWidth > window.innerHeight ? -90 : 0;
    rot = +rot || 0;
    const deitado = Math.abs(rot) === 90;
    const w = deitado ? 1920 : 1080, h = deitado ? 1080 : 1920;
    const s = Math.min(window.innerWidth / w, window.innerHeight / h);
    document.getElementById('app').style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`;
}

window.addEventListener('DOMContentLoaded', () => {
    if (new URLSearchParams(location.search).has('admin')) Admin.abrir();
    else Jogo.iniciar();
});
