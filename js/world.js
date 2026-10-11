// =========================================================================
// O MUNDO: mapas, personagens, colisão, câmera e desenho
// =========================================================================

const ESCALA = 5;            // cada pixel da arte vira 5x5 na tela
const VEL_JOGADOR = 78;      // pixels do mapa por segundo
const DIR_VETOR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// Visual aleatório para os alunos que andam pela escola
const LOOKS_ALUNOS = (() => {
    const peles = ['#f1c8a5', '#e2b48c', '#c98e66', '#a8714d', '#8a5a3c', '#6e4630'];
    const cabelos = ['curto', 'espetado', 'longo', 'rabo', 'cacheado', 'crespo', 'ondulado', 'coque'];
    const corCab = ['#2b1d16', '#4b3527', '#1c1410', '#7a4e2a', '#b07a3e', '#3a2a22'];
    const camisas = ['#2f9e41', '#ffffff', '#2f9e41', '#e6e6e6']; // farda do IF
    const calcas = ['#2f3a5a', '#3b4a6b', '#26324d'];
    const lista = [];
    for (let i = 0; i < 24; i++) {
        const c = cabelos[Math.floor(hash(i, 1, 4) * cabelos.length)];
        lista.push({
            genero: ['longo', 'rabo', 'ondulado', 'coque'].includes(c) ? 'f' : 'm',
            pele: peles[Math.floor(hash(i, 2, 4) * peles.length)], cabelo: c,
            corCabelo: corCab[Math.floor(hash(i, 3, 4) * corCab.length)],
            roupa: 'camisa', corRoupa: camisas[i % camisas.length], corRoupa2: '#ffffff',
            corCalca: calcas[i % calcas.length], acessorios: hash(i, 5, 4) > 0.8 ? ['bone'] : [],
        });
    }
    return lista;
})();

class Personagem {
    constructor(x, y, look, dir = 'down') {
        this.x = x; this.y = y; this.dir = dir; this.look = look;
        this.sheet = Sprites.personagem(look);
        this.andando = false; this.tAnim = 0;
    }
    caixa(nx = this.x, ny = this.y) { return { x: nx - 5, y: ny - 6, w: 10, h: 6 }; }
    quadro() {
        if (!this.andando) return 0;
        return [1, 0, 2, 0][Math.floor(this.tAnim * 8) % 4];
    }
    desenhar(ctx) {
        const f = this.quadro();
        const lin = DIRECOES.indexOf(this.dir);
        const sx = Math.round(this.x - SPRITE_W / 2), sy = Math.round(this.y - SPRITE_H + 2);
        const bob = (this.andando && f !== 0) ? -1 : 0;
        ctx.drawImage(this.sheet, f * SPRITE_W, lin * SPRITE_H, SPRITE_W, SPRITE_H, sx, sy + bob, SPRITE_W, SPRITE_H);
    }
    olharPara(alvo) {
        const dx = alvo.x - this.x, dy = alvo.y - this.y;
        this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
}

class NPC extends Personagem {
    constructor(dados) {
        super(dados.x, dados.y, dados.look, dados.dir);
        this.tipo = dados.tipo;          // 'professor' | 'aluno'
        this.prof = dados.prof || null;
        this.fala = dados.fala || '';
        this.casa = { x: dados.x, y: dados.y };
        this.anda = !!dados.anda;
        this.dirOriginal = dados.dir;
        this.espera = 1 + Math.random() * 3; this.alvo = null; this.tOlhar = 2 + Math.random() * 4;
    }
    caixa(nx = this.x, ny = this.y) { return { x: nx - 6, y: ny - 7, w: 12, h: 7 }; }

    atualizar(dt, mundo) {
        const j = mundo.demo ? null : mundo.jogador;
        const perto = j && Math.hypot(j.x - this.x, j.y - this.y) < 34;
        if (perto && !this.andando) { this.olharPara(j); this.tOlhar = 1.5; return; }

        if (this.anda) {
            if (this.alvo) {
                const dx = this.alvo.x - this.x, dy = this.alvo.y - this.y, d = Math.hypot(dx, dy);
                if (d < 1.5) { this.alvo = null; this.andando = false; this.espera = 1.5 + Math.random() * 4; return; }
                const v = 32 * dt, mx = dx / d * v, my = dy / d * v;
                this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
                if (mundo.livre(this.caixa(this.x + mx, this.y + my), this)) { this.x += mx; this.y += my; this.andando = true; this.tAnim += dt; }
                else { this.alvo = null; this.andando = false; this.espera = 0.5 + Math.random(); }
            } else {
                this.espera -= dt;
                if (this.espera <= 0) {
                    const ang = Math.random() * Math.PI * 2, r = 16 + Math.random() * 40;
                    const a = { x: this.casa.x + Math.cos(ang) * r, y: this.casa.y + Math.sin(ang) * r };
                    if (mundo.livre(this.caixa(a.x, a.y), this)) this.alvo = a; else this.espera = 0.4;
                }
            }
        } else {
            this.tOlhar -= dt;
            if (this.tOlhar <= 0) {
                this.tOlhar = 2.5 + Math.random() * 4;
                const opcoes = ['down', 'down', 'left', 'right', this.dirOriginal];
                this.dir = opcoes[Math.floor(Math.random() * opcoes.length)];
            }
        }
    }
}

const Mundo = {
    canvas: null, ctx: null,
    mapaId: null, mapa: null, cache: {},
    jogador: null, npcs: [], camera: { x: 0, y: 0 },
    particulas: [], t: 0,
    demo: false, demoT: 0,
    alvoInteracao: null,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
    },

    preparar(id) {
        if (this.cache[id]) return this.cache[id];
        const def = MAPAS[id];
        def.w = def.chao[0].length; def.h = def.chao.length;
        def.chao.forEach((l, i) => { if (l.length !== def.w) console.warn(`Mapa ${id}: linha ${i} tem ${l.length} blocos (esperado ${def.w})`); });
        const objetos = def.objetos.map(o => Objetos.criar(o)).filter(Boolean);
        const chao = Tiles.renderizar(def);
        const cctx = chao.getContext('2d');
        // objetos de chão/parede são "carimbados" no chão
        objetos.filter(o => o.camada !== 'y').forEach(o => cctx.drawImage(o.imgs[0], o.x, o.y));
        // luz das janelas
        if (def.ambiente === 'interno') objetos.filter(o => o.tipo === 'janela').forEach(o => {
            cctx.fillStyle = 'rgba(255,246,210,0.10)';
            cctx.beginPath(); cctx.moveTo(o.x + 2, o.y + 22); cctx.lineTo(o.x + 22, o.y + 22); cctx.lineTo(o.x + 52, o.y + 92); cctx.lineTo(o.x + 22, o.y + 92); cctx.fill();
        });
        const m = { id, def, chao, objetos: objetos.filter(o => o.camada === 'y'), todos: objetos };
        this.cache[id] = m;
        return m;
    },

    carregar(id, pos, dir) {
        this.mapaId = id;
        this.mapa = this.preparar(id);
        const def = this.mapa.def;
        if (!this.jogador) this.jogador = new Personagem(pos.x, pos.y, Jogo.jogadorLook(), dir);
        this.jogador.x = pos.x; this.jogador.y = pos.y; this.jogador.dir = dir || 'down'; this.jogador.andando = false;

        // professores deste mapa
        this.npcs = PROFESSORES.filter(p => p.mapa === id).map(p => new NPC({
            tipo: 'professor', prof: p, look: p.look, dir: p.direcao, ...px(p.x, p.y),
        }));
        // alunos andando
        const livres = [];
        for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
            const c = px(x, y);
            if (this.livre({ x: c.x - 8, y: c.y - 10, w: 16, h: 12 })) livres.push(c);
        }
        const qtd = (def.alunos || 0) + (def.alunosParados || 0);
        for (let i = 0; i < qtd && livres.length; i++) {
            const k = Math.floor(hash(i, id.length, 7) * livres.length);
            const c = livres.splice(k, 1)[0];
            if (Math.hypot(c.x - pos.x, c.y - pos.y) < 30) continue;
            this.npcs.push(new NPC({
                tipo: 'aluno', look: LOOKS_ALUNOS[(i * 7 + id.length * 3) % LOOKS_ALUNOS.length],
                dir: ['down', 'left', 'right'][i % 3], x: c.x, y: c.y, anda: i < (def.alunos || 0),
                fala: FALAS_ALUNOS[Math.floor(Math.random() * FALAS_ALUNOS.length)],
            }));
        }
        this.particulas = [];
        this.centralizarCamera(true);
    },

    // ---------- colisão ----------
    tileSolido(tx, ty) {
        const l = this.mapa.def.chao[ty];
        if (!l || tx < 0 || tx >= l.length) return true;
        return SOLIDOS.has(l[tx]);
    },
    livre(r, ignorar = null) {
        const x0 = Math.floor(r.x / TILE), x1 = Math.floor((r.x + r.w - 0.01) / TILE);
        const y0 = Math.floor(r.y / TILE), y1 = Math.floor((r.y + r.h - 0.01) / TILE);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.tileSolido(tx, ty)) return false;
        for (const o of this.mapa.todos) for (const b of o.bases) if (o.camada === 'y' && colide(r, b)) return false;
        for (const n of this.npcs) if (n !== ignorar && colide(r, n.caixa())) return false;
        if (this.jogador && ignorar !== this.jogador && !this.demo && colide(r, this.jogador.caixa())) return false;
        return true;
    },

    // ---------- atualização ----------
    atualizar(dt, teclas) {
        this.t += dt;
        const j = this.jogador;
        if (teclas && !this.demo && j) {
            let vx = 0, vy = 0;
            if (teclas.cima) vy -= 1; if (teclas.baixo) vy += 1;
            if (teclas.esq) vx -= 1; if (teclas.dir) vx += 1;
            if (vx || vy) {
                const n = Math.hypot(vx, vy), v = VEL_JOGADOR * dt;
                const mx = vx / n * v, my = vy / n * v;
                if (vy) this.jogador.dir = vy < 0 ? 'up' : 'down';
                if (vx && (!vy || Math.abs(vx) >= Math.abs(vy))) this.jogador.dir = vx < 0 ? 'left' : 'right';
                if (teclas.ultima) this.jogador.dir = teclas.ultima;
                let moveu = false;
                if (mx && this.livre(j.caixa(j.x + mx, j.y), j)) { j.x += mx; moveu = true; }
                if (my && this.livre(j.caixa(j.x, j.y + my), j)) { j.y += my; moveu = true; }
                // escorrega nos cantos (ajuda a passar por portas)
                if (!moveu) {
                    for (const s of [3, -3]) {
                        if (vy && !vx && this.livre(j.caixa(j.x + s * dt * 20, j.y + my), j) && !this.livre(j.caixa(j.x, j.y + my), j)) { j.x += s * dt * 20; break; }
                        if (vx && !vy && this.livre(j.caixa(j.x + mx, j.y + s * dt * 20), j) && !this.livre(j.caixa(j.x + mx, j.y), j)) { j.y += s * dt * 20; break; }
                    }
                }
                j.andando = true; j.tAnim += dt;
                if (moveu && Math.floor(j.tAnim * 4) !== Math.floor((j.tAnim - dt) * 4)) Som.passo();
            } else { j.andando = false; j.tAnim = 0; }

            // saídas
            for (const w of this.mapa.def.warps) {
                if (colide(j.caixa(), w)) { Jogo.trocarMapa(w.para, w.dest, w.dir); break; }
            }
            this.alvoInteracao = this.procurarAlvo();
        }
        this.npcs.forEach(n => n.atualizar(dt, this));
        this.atualizarParticulas(dt);
        this.centralizarCamera(false, dt);
    },

    procurarAlvo() {
        const j = this.jogador, [dx, dy] = DIR_VETOR[j.dir];
        const p = { x: j.x + dx * 12, y: j.y - 3 + dy * 12 };
        let melhor = null, dist = 16;
        for (const n of this.npcs) {
            const d = Math.hypot(n.x - p.x, n.y - 3 - p.y);
            if (d < dist) { dist = d; melhor = { tipo: n.tipo, npc: n }; }
        }
        if (melhor) return melhor;
        for (const o of this.mapa.todos) if (o.info) {
            const area = o.bases.length ? o.bases : [{ x: o.x, y: o.y, w: o.w, h: o.h + 6 }];
            for (const b of area) if (p.x > b.x - 4 && p.x < b.x + b.w + 4 && p.y > b.y - 4 && p.y < b.y + b.h + 8) return { tipo: 'info', obj: o };
        }
        return null;
    },

    centralizarCamera(imediato, dt = 0) {
        const vw = this.canvas.width / ESCALA, vh = this.canvas.height / ESCALA;
        const W = this.mapa.def.w * TILE, H = this.mapa.def.h * TILE;
        let alvo;
        if (this.demo) {
            // passeio automático da câmera no modo anúncio
            this.demoT += dt * 0.08;
            alvo = { x: (W - vw) / 2 + Math.sin(this.demoT) * (W - vw) / 2, y: (H - vh) / 2 + Math.sin(this.demoT * 0.7) * (H - vh) / 2 };
        } else {
            const j = this.jogador;
            alvo = { x: j.x - vw / 2, y: j.y - 14 - vh / 2 + 12 };
        }
        alvo.x = W <= vw ? (W - vw) / 2 : Math.max(0, Math.min(alvo.x, W - vw));
        alvo.y = H <= vh ? (H - vh) / 2 : Math.max(0, Math.min(alvo.y, H - vh));
        if (imediato) { this.camera.x = alvo.x; this.camera.y = alvo.y; return; }
        const k = this.demo ? 1 : Math.min(1, dt * 8);
        this.camera.x += (alvo.x - this.camera.x) * k;
        this.camera.y += (alvo.y - this.camera.y) * k;
    },

    atualizarParticulas(dt) {
        const def = this.mapa.def;
        if (def.ambiente === 'externo' && this.particulas.length < 14 && Math.random() < dt * 2) {
            const borboleta = Math.random() < 0.25;
            this.particulas.push({
                tipo: borboleta ? 'borboleta' : 'folha', x: this.camera.x + Math.random() * 240, y: this.camera.y - 6,
                vx: 6 + Math.random() * 10, vy: borboleta ? 8 : 10 + Math.random() * 8, t: Math.random() * 6, vida: 14,
                cor: borboleta ? ['#ffd84a', '#ff8fb1', '#ffffff', '#9ec8ff'][Math.floor(Math.random() * 4)] : ['#8ed266', '#f2c230', '#62b84a'][Math.floor(Math.random() * 3)],
            });
        }
        if (def.ambiente === 'interno' && this.particulas.length < 10 && Math.random() < dt) {
            this.particulas.push({ tipo: 'poeira', x: this.camera.x + Math.random() * 220, y: this.camera.y + Math.random() * 380, vx: 2, vy: -2, t: 0, vida: 6, cor: '#fff6d8' });
        }
        this.particulas.forEach(p => {
            p.t += dt; p.vida -= dt;
            p.x += (p.vx + Math.sin(p.t * 2) * 8) * dt;
            p.y += (p.tipo === 'borboleta' ? Math.sin(p.t * 3) * 14 + 2 : p.vy) * dt;
        });
        this.particulas = this.particulas.filter(p => p.vida > 0);
    },

    // ---------- desenho ----------
    desenhar() {
        const ctx = this.ctx, c = this.canvas;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        const externo = this.mapa.def.ambiente === 'externo';
        ctx.fillStyle = externo ? '#2a5a2a' : '#120e1a';
        ctx.fillRect(0, 0, c.width, c.height);

        const cx = Math.round(this.camera.x * ESCALA) / ESCALA, cy = Math.round(this.camera.y * ESCALA) / ESCALA;
        ctx.setTransform(ESCALA, 0, 0, ESCALA, -cx * ESCALA, -cy * ESCALA);
        ctx.drawImage(this.mapa.chao, 0, 0);

        // sombras
        ctx.fillStyle = 'rgba(20,10,30,0.22)';
        this.mapa.objetos.forEach(o => { if (o.sombra) elipse(ctx, o.sombra.x, o.sombra.y, o.sombra.rx, o.sombra.ry); });
        const pessoas = [...this.npcs, ...(this.demo ? [] : [this.jogador])];
        pessoas.forEach(p => elipse(ctx, p.x, p.y, 6, 2));

        // objetos e personagens em ordem de profundidade
        const lista = [
            ...this.mapa.objetos.map(o => ({ y: o.ordem, d: () => ctx.drawImage(o.imgs[Math.floor(this.t * 5) % o.imgs.length], o.x, o.y) })),
            ...pessoas.map(p => ({ y: p.y, d: () => p.desenhar(ctx) })),
        ].sort((a, b) => a.y - b.y);
        lista.forEach(i => i.d());

        // partículas
        this.particulas.forEach(p => {
            ctx.globalAlpha = Math.min(1, p.vida / 2) * (p.tipo === 'poeira' ? 0.5 : 1);
            ctx.fillStyle = p.cor;
            if (p.tipo === 'borboleta') {
                const aberta = Math.floor(p.t * 10) % 2;
                ctx.fillRect(p.x - (aberta ? 2 : 1), p.y, aberta ? 2 : 1, 2); ctx.fillRect(p.x + 1, p.y, aberta ? 2 : 1, 2);
                ctx.fillStyle = '#2b2b33'; ctx.fillRect(p.x, p.y, 1, 2);
            } else ctx.fillRect(p.x, p.y, p.tipo === 'poeira' ? 1 : 2, 1);
        });
        ctx.globalAlpha = 1;

        // balões em cima dos professores
        this.npcs.forEach(n => {
            if (n.tipo !== 'professor') return;
            const feito = Jogo.professorFeitoHoje(n.prof.id);
            const bx = Math.round(n.x) - 4, by = Math.round(n.y - 34 + Math.sin(this.t * 4 + n.x) * 1.5);
            balao(ctx, bx, by, feito ? '#3cb251' : '#ffd84a', feito ? 'ok' : '!');
        });

        // indicador de interação
        if (!this.demo && this.alvoInteracao && Jogo.estado === 'JOGO') {
            const a = this.alvoInteracao;
            let x, y;
            if (a.npc) { x = a.npc.x; y = a.npc.y - 30; } else { x = a.obj.x + a.obj.w / 2; y = a.obj.y - 4; }
            if (!(a.npc && a.npc.tipo === 'professor')) balao(ctx, Math.round(x) - 4, Math.round(y + Math.sin(this.t * 5) * 1.2), '#ffffff', '...');
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
};

function colide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function elipse(ctx, x, y, rx, ry) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

// Balãozinho pixelado (8x9) com "!", "ok" ou "..."
function balao(ctx, x, y, cor, tipo) {
    ctx.fillStyle = '#1b1424'; ctx.fillRect(x, y - 1, 9, 10); ctx.fillRect(x - 1, y, 11, 8);
    ctx.fillStyle = cor; ctx.fillRect(x, y, 9, 8);
    ctx.fillStyle = '#1b1424'; ctx.fillRect(x + 3, y + 9, 3, 1); ctx.fillRect(x + 4, y + 10, 1, 1);
    ctx.fillStyle = cor; ctx.fillRect(x + 4, y + 8, 1, 2);
    ctx.fillStyle = '#1b1424';
    if (tipo === '!') { ctx.fillRect(x + 4, y + 1, 1, 4); ctx.fillRect(x + 4, y + 6, 1, 1); }
    if (tipo === 'ok') { ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 2, y + 4, 1, 1); ctx.fillRect(x + 3, y + 5, 1, 1); ctx.fillRect(x + 4, y + 4, 1, 1); ctx.fillRect(x + 5, y + 3, 1, 1); ctx.fillRect(x + 6, y + 2, 1, 1); }
    if (tipo === '...') { ctx.fillRect(x + 2, y + 4, 1, 1); ctx.fillRect(x + 4, y + 4, 1, 1); ctx.fillRect(x + 6, y + 4, 1, 1); }
}
