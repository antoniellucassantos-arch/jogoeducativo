// =========================================================================
// PAINEL DA ESCOLA (abra index.html?admin)
// Importar perguntas e alunos, enviar anúncios, ver ranking e configurar o totem.
// =========================================================================

const Admin = {
    aba: 'perguntas',

    abrir() {
        if (CONFIG.senhaAdmin && prompt('Senha do painel:') !== CONFIG.senhaAdmin) {
            document.body.innerHTML = '<p style="color:#fff;font:24px sans-serif;padding:40px">Senha incorreta. Recarregue a página para tentar de novo.</p>';
            return;
        }
        document.getElementById('app').style.display = 'none';
        PERGUNTAS.carregarExtras();
        const el = $('admin');
        el.classList.remove('oculto');
        el.innerHTML = `
            <header><h1>EduQuest · Painel da escola</h1><a href="index.html">▶ Voltar ao jogo</a></header>
            <nav>${[['perguntas', 'Perguntas'], ['alunos', 'Alunos'], ['anuncios', 'Anúncios'], ['ranking', 'Ranking'], ['config', 'Configurações'], ['backup', 'Backup']]
                .map(([id, n]) => `<button data-aba="${id}">${n}</button>`).join('')}</nav>
            <main id="admin-main"></main>`;
        el.querySelectorAll('nav button').forEach(b => b.onclick = () => this.mostrar(b.dataset.aba));
        this.mostrar(this.aba);
    },

    mostrar(aba) {
        this.aba = aba;
        $('admin').querySelectorAll('nav button').forEach(b => b.classList.toggle('ativo', b.dataset.aba === aba));
        $('admin-main').innerHTML = this[aba]();
        const ligar = this['ligar_' + aba];
        ligar && ligar.call(this);
    },

    // ---------------- PERGUNTAS ----------------
    perguntas() {
        const c = PERGUNTAS.contagem();
        const extras = Dados.perguntasExtras();
        const linhas = Object.entries(MATERIAS).map(([id, m]) => {
            const x = extras.filter(q => q.materia === id).length;
            const prof = PROFESSORES.filter(p => p.materias.includes(id)).map(p => p.nome).join(', ');
            return `<tr><td><b style="color:${m.cor}">${m.icone} ${m.nome}</b><br><small>${prof}</small></td><td>${c[id][1]}</td><td>${c[id][2]}</td><td>${c[id][3]}</td><td><b>${c[id].total}</b></td><td>${x || '-'}</td></tr>`;
        }).join('');
        return `
        <section>
            <h2>Banco de perguntas</h2>
            <table><tr><th>Matéria</th><th>Fácil</th><th>Médio</th><th>Difícil</th><th>Total</th><th>Importadas aqui</th></tr>${linhas}</table>
        </section>
        <section>
            <h2>Importar perguntas (planilha CSV)</h2>
            <p>Monte uma planilha no Excel/Google Planilhas com as colunas abaixo e salve como <b>CSV</b>. A primeira linha é o cabeçalho.</p>
            <pre>materia;dificuldade;pergunta;correta;errada1;errada2;errada3;explicacao</pre>
            <p>Matérias aceitas: ${Object.entries(MATERIAS).map(([id, m]) => `<code>${id}</code> (${m.nome})`).join(', ')}. Dificuldade: <code>1</code>, <code>2</code> ou <code>3</code>.</p>
            <p><button id="baixar-modelo">Baixar planilha modelo</button></p>
            <input type="file" id="csv-perguntas" accept=".csv,text/csv,text/plain">
            <p>ou cole o conteúdo aqui:</p>
            <textarea id="csv-texto" rows="6" placeholder="materia;dificuldade;pergunta;correta;errada1;errada2;errada3;explicacao"></textarea>
            <p><button id="ler-csv">Conferir</button></p>
            <div id="csv-resultado"></div>
        </section>
        <section>
            <h2>Perguntas importadas no totem: ${extras.length}</h2>
            <p><button id="exportar-extras" ${extras.length ? '' : 'disabled'}>Baixar como CSV</button>
            <button class="perigo" id="apagar-extras" ${extras.length ? '' : 'disabled'}>Apagar todas as importadas</button></p>
            <p><small>As perguntas que vêm com o jogo ficam nos arquivos <code>data/perguntas/*.js</code>.</small></p>
        </section>`;
    },
    ligar_perguntas() {
        let lidas = [];
        const conferir = texto => {
            const r = PERGUNTAS.lerCSV(texto);
            lidas = r.ok;
            $('csv-resultado').innerHTML = `
                <p class="${r.ok.length ? 'ok' : ''}">✔ ${r.ok.length} perguntas prontas para importar</p>
                ${r.erros.length ? `<p class="erro">✖ ${r.erros.length} linhas com problema:</p><ul>${r.erros.slice(0, 30).map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
                ${r.ok.length ? `<p><button id="importar-csv">Importar ${r.ok.length} perguntas</button></p>` : ''}`;
            const b = $('importar-csv');
            if (b) b.onclick = () => {
                const todas = Dados.perguntasExtras().concat(lidas);
                if (!Dados.salvarPerguntasExtras(todas)) return alert('Não coube no armazenamento do navegador. Coloque as perguntas num arquivo em data/perguntas/.');
                alert(`${lidas.length} perguntas importadas!`);
                location.reload();
            };
        };
        $('csv-perguntas').onchange = e => lerArquivo(e.target.files[0], conferir);
        $('ler-csv').onclick = () => conferir($('csv-texto').value);
        $('baixar-modelo').onclick = () => baixar('modelo-perguntas.csv',
            '﻿materia;dificuldade;pergunta;correta;errada1;errada2;errada3;explicacao\n' +
            'matematica;1;Quanto é 7 x 8?;56;54;48;64;7 x 8 = 56.\n' +
            'historia;2;Em que ano foi proclamada a República no Brasil?;1889;1822;1888;1930;A República foi proclamada em 15 de novembro de 1889.\n');
        $('exportar-extras').onclick = () => baixar('perguntas-importadas.csv', '﻿materia;dificuldade;pergunta;correta;errada1;errada2;errada3;explicacao\n' +
            Dados.perguntasExtras().map(q => [q.materia, q.dif, q.texto, q.certa, ...q.erradas, q.exp].map(csvCampo).join(';')).join('\n'));
        $('apagar-extras').onclick = () => { if (confirm('Apagar todas as perguntas importadas pelo painel?')) { Dados.salvarPerguntasExtras([]); location.reload(); } };
    },

    // ---------------- ALUNOS ----------------
    alunos() {
        const a = Dados.alunos();
        const n = Object.keys(a).length;
        const turmas = {};
        Object.values(a).forEach(x => { turmas[x.turma || '(sem turma)'] = (turmas[x.turma || '(sem turma)'] || 0) + 1; });
        return `
        <section>
            <h2>Alunos cadastrados: ${n}</h2>
            <p>Com a lista de alunos, o jogo mostra o <b>nome</b> no lugar da matrícula e separa o ranking por turma.</p>
            ${n ? `<table><tr><th>Turma</th><th>Alunos</th></tr>${Object.entries(turmas).map(([t, q]) => `<tr><td>${esc(t)}</td><td>${q}</td></tr>`).join('')}</table>` : ''}
            <p><label><input type="checkbox" id="so-cadastrados" ${CONFIG.somenteAlunosCadastrados ? 'checked' : ''}> Só deixar jogar quem está na lista</label></p>
        </section>
        <section>
            <h2>Importar lista (CSV)</h2>
            <pre>matricula;nome;turma
20231001;Maria Souza;1º Info
20231002;João Lima;2º Edif</pre>
            <input type="file" id="csv-alunos" accept=".csv,text/csv,text/plain">
            <p><label><input type="checkbox" id="substituir-alunos"> Substituir a lista atual (senão, adiciona)</label></p>
            <div id="alunos-resultado"></div>
            <p><button class="perigo" id="apagar-alunos" ${n ? '' : 'disabled'}>Apagar lista de alunos</button></p>
        </section>`;
    },
    ligar_alunos() {
        $('so-cadastrados').onchange = e => salvarConfig({ somenteAlunosCadastrados: e.target.checked });
        $('csv-alunos').onchange = e => lerArquivo(e.target.files[0], texto => {
            const linhas = parseCSV(texto).filter(l => l.some(c => c.trim()));
            const lista = $('substituir-alunos').checked ? {} : Dados.alunos();
            let n = 0;
            linhas.forEach(l => {
                const m = (l[0] || '').replace(/\D/g, '');
                if (!m) return; // pula cabeçalho
                lista[m] = { nome: (l[1] || '').trim(), turma: (l[2] || '').trim() };
                n++;
            });
            Dados.salvarAlunos(lista);
            alert(`${n} alunos importados.`);
            this.mostrar('alunos');
        });
        $('apagar-alunos').onclick = () => { if (confirm('Apagar a lista de alunos? (o progresso dos jogadores continua salvo)')) { Dados.salvarAlunos({}); this.mostrar('alunos'); } };
    },

    // ---------------- ANÚNCIOS ----------------
    anuncios() {
        const extras = Dados.anunciosExtras();
        return `
        <section>
            <h2>Anúncios do modo descanso</h2>
            <p>Quando ninguém está jogando, o totem mostra estes anúncios junto com o ranking e os professores.</p>
            <div class="anuncios">
                ${ANUNCIOS.map(a => `<figure><img src="${a.imagem}"><figcaption>${esc(a.titulo || '')}<br><small>arquivo do jogo</small></figcaption></figure>`).join('')}
                ${extras.map((a, i) => `<figure><img src="${a.imagem}"><figcaption>${esc(a.titulo || '')}<br><button class="perigo" data-del="${i}">remover</button></figcaption></figure>`).join('')}
            </div>
        </section>
        <section>
            <h2>Enviar novo anúncio</h2>
            <p>A imagem é reduzida automaticamente. De preferência, use imagens em pé (formato de story).</p>
            <p><input type="text" id="anuncio-titulo" placeholder="Título (opcional)"></p>
            <input type="file" id="anuncio-img" accept="image/*">
        </section>`;
    },
    ligar_anuncios() {
        $('admin-main').querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
            const l = Dados.anunciosExtras(); l.splice(+b.dataset.del, 1); Dados.salvarAnunciosExtras(l); this.mostrar('anuncios');
        });
        $('anuncio-img').onchange = e => {
            const f = e.target.files[0]; if (!f) return;
            const img = new Image();
            img.onload = () => {
                const s = Math.min(1, 900 / img.width, 1100 / img.height);
                const c = document.createElement('canvas');
                c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                const l = Dados.anunciosExtras();
                l.push({ imagem: c.toDataURL('image/jpeg', 0.82), titulo: $('anuncio-titulo').value.trim() });
                if (!Dados.salvarAnunciosExtras(l)) return alert('Sem espaço. Remova algum anúncio ou coloque a imagem em img/anuncios/.');
                this.mostrar('anuncios');
            };
            img.src = URL.createObjectURL(f);
        };
    },

    // ---------------- RANKING ----------------
    ranking() {
        const l = Dados.ranking('geral');
        const sem = Dados.todos().filter(j => !j.xpTotal).length;
        return `
        <section>
            <h2>Ranking geral (${l.length} alunos pontuaram${sem ? `, ${sem} sem pontos` : ''})</h2>
            <p><button id="exportar-ranking" ${l.length ? '' : 'disabled'}>Baixar planilha</button>
            <button class="perigo" id="zerar">Zerar ranking e progresso</button></p>
            <table><tr><th>#</th><th>Matrícula</th><th>Nome</th><th>Turma</th><th>Nível</th><th>XP total</th><th>XP semana</th><th>Acertos</th><th>Erros</th></tr>
            ${l.map((j, i) => `<tr><td>${i + 1}</td><td>${esc(j.matricula)}</td><td>${esc(j.nome || '-')}</td><td>${esc(j.turma || '-')}</td><td>${Niveis.de(j.xpTotal).nivel}</td><td>${j.xpTotal}</td><td>${j.semana.xp}</td><td>${soma(j.acertos)}</td><td>${soma(j.erros)}</td></tr>`).join('')}
            </table>
        </section>`;
    },
    ligar_ranking() {
        $('exportar-ranking').onclick = () => baixar('ranking-eduquest.csv', '﻿posicao;matricula;nome;turma;nivel;xp_total;xp_semana;acertos;erros\n' +
            Dados.ranking('geral').map((j, i) => [i + 1, j.matricula, j.nome, j.turma, Niveis.de(j.xpTotal).nivel, j.xpTotal, j.semana.xp, soma(j.acertos), soma(j.erros)].map(csvCampo).join(';')).join('\n'));
        $('zerar').onclick = () => {
            if (prompt('Isso apaga o progresso de TODOS os alunos. Digite ZERAR para confirmar.') === 'ZERAR') { Dados.apagarJogadores(); this.mostrar('ranking'); }
        };
    },

    // ---------------- CONFIG ----------------
    config() {
        const campo = (k, rotulo, tipo = 'number', extra = '') => `<label>${rotulo}<input type="${tipo}" data-k="${k}" value="${esc(CONFIG[k])}" ${extra}></label>`;
        return `
        <section class="form">
            <h2>Configurações do totem</h2>
            ${campo('limiteDiario', 'Desafios por aluno por dia', 'number', 'min="1" max="50"')}
            ${campo('tempoPergunta', 'Segundos para responder (0 = sem limite)', 'number', 'min="0" max="600"')}
            ${campo('tempoOcioso', 'Segundos parado até voltar aos anúncios', 'number', 'min="15" max="600"')}
            ${campo('tempoSlide', 'Segundos de cada anúncio', 'number', 'min="3" max="60"')}
            ${campo('digitosMatricula', 'Mínimo de dígitos da matrícula', 'number', 'min="1" max="14"')}
            <label>Rotação da tela
                <select data-k="rotacao">${[['auto', 'Automática'], ['-90', 'Girar para a esquerda (-90°)'], ['90', 'Girar para a direita (90°)'], ['0', 'Sem girar']].map(([v, n]) => `<option value="${v}" ${String(CONFIG.rotacao) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label>XP fácil<input type="number" data-xp="1" value="${CONFIG.xp[1]}"></label>
            <label>XP médio<input type="number" data-xp="2" value="${CONFIG.xp[2]}"></label>
            <label>XP difícil<input type="number" data-xp="3" value="${CONFIG.xp[3]}"></label>
            <label>Bônus máximo por rapidez<input type="number" data-xp="bonusRapido" value="${CONFIG.xp.bonusRapido}"></label>
            <label class="check"><input type="checkbox" data-k="som" ${CONFIG.som ? 'checked' : ''}> Efeitos sonoros</label>
            <p><button id="salvar-config">Salvar</button> <button id="restaurar-config">Voltar ao padrão</button></p>
        </section>`;
    },
    ligar_config() {
        $('salvar-config').onclick = () => {
            const novo = { xp: Object.assign({}, CONFIG.xp) };
            $('admin-main').querySelectorAll('[data-k]').forEach(i => {
                const k = i.dataset.k;
                novo[k] = i.type === 'checkbox' ? i.checked : (k === 'rotacao' ? (i.value === 'auto' ? 'auto' : +i.value) : +i.value);
            });
            $('admin-main').querySelectorAll('[data-xp]').forEach(i => { novo.xp[i.dataset.xp] = +i.value; });
            salvarConfig(novo);
            alert('Configurações salvas!');
        };
        $('restaurar-config').onclick = () => { Dados.apagar('config'); location.reload(); };
    },

    // ---------------- BACKUP ----------------
    backup() {
        return `
        <section>
            <h2>Backup</h2>
            <p>Salva tudo deste totem (progresso dos alunos, ranking, alunos, perguntas e anúncios importados) num arquivo. Use para trocar de computador ou por segurança.</p>
            <p><button id="exportar-tudo">Baixar backup</button></p>
            <h2>Restaurar</h2>
            <input type="file" id="importar-tudo" accept=".json,application/json">
        </section>`;
    },
    ligar_backup() {
        $('exportar-tudo').onclick = () => baixar(`backup-eduquest-${Dados.hoje()}.json`, JSON.stringify(Dados.exportar()));
        $('importar-tudo').onchange = e => lerArquivo(e.target.files[0], t => {
            try { Dados.importar(JSON.parse(t)); alert('Backup restaurado!'); location.reload(); }
            catch (err) { alert('Arquivo inválido.'); }
        });
    },
};

function salvarConfig(mudancas) {
    const atual = Dados.ler('config', {});
    Object.assign(atual, mudancas);
    Dados.salvar('config', atual);
    Object.assign(CONFIG, mudancas);
}
function lerArquivo(f, cb) {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => cb(r.result);
    r.readAsText(f, 'utf-8');
}
function baixar(nome, texto) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
    a.download = nome; a.click();
}
function csvCampo(v) {
    v = String(v === undefined || v === null ? '' : v);
    return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function soma(o) { return Object.values(o || {}).reduce((a, b) => a + b, 0); }
