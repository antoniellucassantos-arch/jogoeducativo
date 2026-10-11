// =========================================================================
// INTERFACE: HUD, diálogos, avisos e o modo anúncio do totem
// =========================================================================

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Personagens que o aluno pode escolher (farda do IF)
const AVATARES = [
    { genero: 'm', pele: '#e2b48c', cabelo: 'espetado', corCabelo: '#2b1d16', roupa: 'camisa', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#2f3a5a' },
    { genero: 'f', pele: '#f1c8a5', cabelo: 'longo', corCabelo: '#4b3527', roupa: 'camisa', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#2f3a5a' },
    { genero: 'm', pele: '#8a5a3c', cabelo: 'crespo', corCabelo: '#1c1410', roupa: 'camisa', corRoupa: '#ffffff', corRoupa2: '#2f9e41', corCalca: '#26324d' },
    { genero: 'f', pele: '#a8714d', cabelo: 'cacheado', corCabelo: '#24170f', roupa: 'camisa', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#26324d' },
    { genero: 'm', pele: '#c98e66', cabelo: 'curto', corCabelo: '#3a2a22', roupa: 'camisa', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#3b4a6b', acessorios: ['bone'], corBone: '#e5484d' },
    { genero: 'f', pele: '#e2b48c', cabelo: 'rabo', corCabelo: '#7a4e2a', roupa: 'camisa', corRoupa: '#ffffff', corRoupa2: '#2f9e41', corCalca: '#2f3a5a' },
    { genero: 'm', pele: '#6e4630', cabelo: 'curto', corCabelo: '#1c1410', roupa: 'camisa', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#2f3a5a', oculos: true },
    { genero: 'f', pele: '#c98e66', cabelo: 'coque', corCabelo: '#2b1d16', roupa: 'camisa', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#26324d', acessorios: ['brincos'] },
    { genero: 'm', pele: '#f1c8a5', cabelo: 'ondulado', corCabelo: '#b07a3e', roupa: 'camisa', corRoupa: '#ffffff', corRoupa2: '#2f9e41', corCalca: '#3b4a6b' },
    { genero: 'f', pele: '#6e4630', cabelo: 'crespo', corCabelo: '#1c1410', roupa: 'camisa', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#2f3a5a', acessorios: ['tiara'] },
    { genero: 'm', pele: '#a8714d', cabelo: 'espetado', corCabelo: '#4b3527', roupa: 'esporte', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#1f3b2a' },
    { genero: 'f', pele: '#f1c8a5', cabelo: 'curto', corCabelo: '#1c1410', roupa: 'camisa', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#26324d', oculos: true },
];
AVATARES.forEach(a => { a.aluno = true; if (a.corBone) a.corRoupa2 = a.corBone; });

const UI = {
    mostrar(...ids) { ids.forEach(id => $(id).classList.remove('oculto')); },
    esconder(...ids) { ids.forEach(id => $(id).classList.add('oculto')); },

    fade(meio) {
        return new Promise(res => {
            $('fade').classList.add('ativo');
            setTimeout(() => { meio && meio(); requestAnimationFrame(() => { $('fade').classList.remove('ativo'); setTimeout(res, 230); }); }, 230);
        });
    },

    banner(texto) {
        $('local-nome').textContent = texto;
        const b = $('local-banner');
        b.classList.add('visivel');
        clearTimeout(this._banner);
        this._banner = setTimeout(() => b.classList.remove('visivel'), 2600);
    },

    hud(j) {
        const n = Niveis.de(j.xpTotal);
        $('hud-avatar').src = Sprites.retratoURL(Jogo.lookDe(j), 3);
        $('hud-nome').textContent = Dados.nomeExibicao(j);
        $('hud-titulo').textContent = n.titulo + (j.turma ? ' · ' + j.turma : '');
        $('hud-nivel').textContent = n.nivel;
        $('hud-xp-barra').style.width = Math.round(n.xp / n.falta * 100) + '%';
        $('hud-xp-texto').textContent = `${n.xp} / ${n.falta} XP`;
        const lim = CONFIG.limiteDiario;
        $('hud-hoje').innerHTML = Array.from({ length: lim }, (_, i) => `<i class="${i < j.hoje.respondidas ? 'cheio' : ''}"></i>`).join('');
    },

    modal(titulo, texto, teclas) {
        $('modal-titulo').innerHTML = titulo;
        $('modal-texto').innerHTML = texto;
        $('modal-teclas').innerHTML = teclas;
        this.mostrar('modal');
    },
};

// =========================================================================
// CAIXA DE DIÁLOGO (texto aparecendo letra por letra)
// =========================================================================
const Dialogo = {
    falas: [], i: 0, mostrado: 0, completo: false, aoFim: null, timer: null, opcoes: null,

    abrir({ nome, cor, retrato, falas, opcoes = null, aoFim = null }) {
        this.falas = Array.isArray(falas) ? falas : [falas];
        this.i = 0; this.aoFim = aoFim; this.opcoes = opcoes;
        $('dialogo-nome').textContent = nome || '';
        $('dialogo-nome').style.display = nome ? '' : 'none';
        $('dialogo-nome').style.background = cor || 'var(--verde)';
        const r = $('dialogo-retrato');
        if (retrato) { $('dialogo-img').src = retrato; r.classList.remove('sem'); } else r.classList.add('sem');
        UI.mostrar('dialogo');
        this.escrever();
    },

    escrever() {
        const texto = this.falas[this.i];
        const ultima = this.i === this.falas.length - 1;
        $('dialogo-opcoes').innerHTML = '';
        $('dialogo-seta').style.visibility = 'hidden';
        this.mostrado = 0; this.completo = false;
        clearInterval(this.timer);
        const el = $('dialogo-texto');
        el.textContent = '';
        this.timer = setInterval(() => {
            this.mostrado += 2;
            el.textContent = texto.slice(0, this.mostrado);
            if (this.mostrado % 4 === 0) Som.blip();
            if (this.mostrado >= texto.length) this.terminarLinha(ultima);
        }, 30);
    },

    terminarLinha(ultima) {
        clearInterval(this.timer);
        $('dialogo-texto').textContent = this.falas[this.i];
        this.completo = true;
        if (ultima && this.opcoes) {
            $('dialogo-opcoes').innerHTML = this.opcoes.html;
            $('dialogo-opcoes').querySelectorAll('[data-tecla]').forEach(b => b.onclick = () => Jogo.tecla(b.dataset.tecla));
        } else $('dialogo-seta').style.visibility = 'visible';
    },

    // ENTER: completa o texto, passa para a próxima fala ou fecha
    avancar() {
        const ultima = this.i === this.falas.length - 1;
        if (!this.completo) { this.terminarLinha(ultima); return; }
        if (ultima && this.opcoes) return;
        if (!ultima) { this.i++; Som.blip(); this.escrever(); return; }
        this.fechar();
        this.aoFim && this.aoFim();
    },

    fechar() { clearInterval(this.timer); UI.esconder('dialogo'); },
};

// =========================================================================
// MODO ANÚNCIO (quando ninguém está jogando)
// =========================================================================
const Anuncios = {
    slides: [], i: 0, timer: null,

    iniciar() {
        this.montar();
        this.i = -1;
        this.proximo();
        clearInterval(this.timer);
        this.timer = setInterval(() => this.proximo(), CONFIG.tempoSlide * 1000);
    },
    parar() { clearInterval(this.timer); },

    montar() {
        const s = [];
        const imagens = [...ANUNCIOS, ...Dados.anunciosExtras()];
        const avisos = AVISOS.slice();
        s.push(() => this.slideComoJogar());
        imagens.forEach(a => s.push(() => this.slideImagem(a)));
        s.push(() => this.slideRanking('geral'));
        avisos.forEach(a => s.push(() => this.slideAviso(a)));
        s.push(() => this.slideProfessores());
        s.push(() => this.slideRanking('semana'));
        s.push(() => this.slideNumeros());
        this.slides = s;
    },

    proximo() {
        this.i = (this.i + 1) % this.slides.length;
        const el = $('slide');
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
        el.innerHTML = this.slides[this.i]();
        $('slide-pontos').innerHTML = this.slides.map((_, k) => `<i class="${k === this.i ? 'ativo' : ''}"></i>`).join('');
    },

    slideImagem(a) {
        return `${a.titulo ? `<div class="slide-titulo">${esc(a.titulo)}</div>` : ''}<img class="slide-img" src="${a.imagem}" alt="">`;
    },

    slideAviso(a) {
        return `<div class="slide-aviso"><div class="icone">${a.icone || '📢'}</div><h3 style="color:${a.cor || 'var(--amarelo)'}">${esc(a.titulo)}</h3><div>${esc(a.texto)}</div></div>`;
    },

    slideRanking(tipo) {
        const lista = Dados.ranking(tipo).slice(0, 8);
        const titulo = tipo === 'semana' ? '🔥 DESTAQUES<br>DA SEMANA' : '🏆 RANKING<br>DO CAMPUS';
        if (!lista.length) return `<div class="slide-titulo">${titulo}</div><div class="rank-vazio">Ninguém pontuou ${tipo === 'semana' ? 'esta semana' : 'ainda'}.<br><br>Seja o primeiro!<br>Aperte <kbd class="largo">ENTER</kbd></div>`;
        const linhas = lista.map((j, i) => {
            const n = Niveis.de(j.xpTotal);
            return `<div class="rank-linha ${i < 3 ? 'top' + (i + 1) : ''}">
                <div class="rank-pos">${i + 1}º</div>
                <img class="rank-avatar" src="${Sprites.personagemURL(Jogo.lookDe(j), 'down', 4)}" alt="">
                <div class="rank-nome">${esc(Dados.nomeExibicao(j))}<small>Nível ${n.nivel} · ${n.titulo}${j.turma ? ' · ' + esc(j.turma) : ''}</small></div>
                <div class="rank-xp">${j.pontos}<br>XP</div></div>`;
        }).join('');
        return `<div class="slide-titulo">${titulo}</div><div class="ranking">${linhas}</div>`;
    },

    slideProfessores() {
        const cards = PROFESSORES.map(p => {
            const m = p.materias.map(id => MATERIAS[id].nome).join(' e ');
            return `<div class="prof-card" style="--cor:${MATERIAS[p.materias[0]].cor}"><img src="${Sprites.retratoURL(p.look, 4)}" alt=""><div><b>${esc(p.nome)}</b><span>${esc(m)}</span></div></div>`;
        }).join('');
        return `<div class="slide-titulo">OS PROFESSORES<small>Encontre todos pela escola!</small></div><div class="profs-grade">${cards}</div>`;
    },

    slideComoJogar() {
        const np = ativas => `<div class="numpad">${['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(k => `<kbd class="${ativas.includes(k) ? 'ativa' : ''}">${k}</kbd>`).join('')}</div>`;
        return `<div class="slide-titulo">COMO JOGAR</div>
            <div class="comojogar">
                <div class="passo"><div class="teclas"><kbd class="largo">ENTER</kbd></div><div>Digite sua <b>matrícula</b> e escolha seu personagem</div></div>
                <div class="passo"><div class="teclas">${np(['8', '4', '6', '2'])}</div><div>Ande pela escola e encontre os <b>professores</b></div></div>
                <div class="passo"><div class="teclas">${np(['5'])}</div><div>Converse e escolha o nível do <b>desafio</b></div></div>
                <div class="passo"><div class="teclas"><kbd class="ativa">1</kbd><kbd class="ativa">2</kbd><kbd class="ativa">3</kbd><kbd class="ativa">4</kbd></div><div>Responda e ganhe <b>XP</b>. Até ${CONFIG.limiteDiario} desafios por dia!</div></div>
            </div>`;
    },

    slideNumeros() {
        const c = PERGUNTAS.contagem();
        const total = Object.values(c).reduce((s, m) => s + m.total, 0);
        const jogadores = Dados.lista().length;
        const resp = Dados.todos().reduce((s, j) => s + Object.values(j.acertos).reduce((a, b) => a + b, 0) + Object.values(j.erros).reduce((a, b) => a + b, 0), 0);
        return `<div class="slide-titulo">EDUQUEST EM NÚMEROS</div>
            <div class="stats-grade">
                <div class="stat"><b>${total}</b><span>perguntas no banco</span></div>
                <div class="stat"><b>${PROFESSORES.length}</b><span>professores</span></div>
                <div class="stat"><b>${jogadores}</b><span>alunos jogando</span></div>
                <div class="stat"><b>${resp}</b><span>desafios respondidos</span></div>
                <div class="stat"><b>${Object.keys(MATERIAS).length}</b><span>matérias</span></div>
                <div class="stat"><b>5</b><span>lugares para explorar</span></div>
            </div>`;
    },
};

// Confete do "subiu de nível"
function confete() {
    const el = $('confete');
    const cores = ['#ffd84a', '#5fd06f', '#3d7be0', '#e5484d', '#ff8fb1', '#ffffff'];
    el.innerHTML = Array.from({ length: 70 }, () => {
        const s = 12 + Math.random() * 18;
        return `<i style="left:${Math.random() * 100}%;width:${s}px;height:${s}px;background:${cores[Math.floor(Math.random() * cores.length)]};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * 0.8}s"></i>`;
    }).join('');
}
