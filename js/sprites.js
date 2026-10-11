// =========================================================================
// GERADOR DE PIXEL ART
// Personagens e retratos são desenhados por código a partir de uma "aparência"
// (cor da pele, cabelo, roupa...). Para mudar um professor basta mudar os dados
// em data/professores.js, sem precisar de imagem.
// =========================================================================

const Cor = {
    rgb(hex) {
        const n = parseInt(hex.slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },
    hex([r, g, b]) {
        const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
        return '#' + c(r) + c(g) + c(b);
    },
    // f < 0 escurece, f > 0 clareia
    shade(hex, f) {
        const [r, g, b] = this.rgb(hex);
        if (f < 0) return this.hex([r * (1 + f), g * (1 + f), b * (1 + f) * 1.04 + 4]);
        return this.hex([r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f]);
    },
    mix(a, b, t) {
        const A = this.rgb(a), B = this.rgb(b);
        return this.hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
    },
};

// Grade de pixels simples (cada célula guarda uma cor ou null)
class Grid {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
    set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
    get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.d[y * this.w + x] : null; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    row(y, x0, x1, c) { for (let x = x0; x <= x1; x++) this.set(x, y, c); }
    col(x, y0, y1, c) { for (let y = y0; y <= y1; y++) this.set(x, y, c); }
    pts(list, c) { list.forEach(([x, y]) => this.set(x, y, c)); }
    // pinta só onde já existe algo (bom para sombras)
    tint(x, y, c) { if (this.get(x, y)) this.set(x, y, c); }

    padded(n) {
        const g = new Grid(this.w + n * 2, this.h + n * 2);
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g.set(x + n, y + n, this.get(x, y));
        return g;
    }
    mirrored() {
        const g = new Grid(this.w, this.h);
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g.set(this.w - 1 - x, y, this.get(x, y));
        return g;
    }
    // Contorno escuro automático, puxando a cor do vizinho (fica com cara de pixel art feita à mão)
    outline(base = '#1b1424') {
        const out = [];
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
            if (this.get(x, y)) continue;
            const v = this.get(x, y - 1) || this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y + 1);
            if (v) out.push([x, y, Cor.mix(Cor.shade(v, -0.62), base, 0.45)]);
        }
        out.forEach(([x, y, c]) => this.set(x, y, c));
        return this;
    }
    drawTo(ctx, ox = 0, oy = 0) {
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
            const c = this.d[y * this.w + x];
            if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); }
        }
    }
    toCanvas() {
        const c = document.createElement('canvas');
        c.width = this.w; c.height = this.h;
        this.drawTo(c.getContext('2d'));
        return c;
    }
}

// =========================================================================
// PERSONAGEM DO MAPA (16x24, 4 direções, 3 quadros)
// =========================================================================

const SPRITE_W = 18, SPRITE_H = 26; // com 1px de borda para o contorno
const DIRECOES = ['down', 'left', 'right', 'up'];

const Sprites = {
    cache: new Map(),

    // Folha de sprites: linhas = direção, colunas = quadro (0 parado, 1 e 2 andando)
    personagem(look) {
        const key = 'p' + JSON.stringify(look);
        if (this.cache.has(key)) return this.cache.get(key);
        const sheet = document.createElement('canvas');
        sheet.width = SPRITE_W * 3; sheet.height = SPRITE_H * 4;
        const ctx = sheet.getContext('2d');
        DIRECOES.forEach((dir, r) => {
            for (let f = 0; f < 3; f++) {
                let g = new Grid(16, 24);
                const view = dir === 'left' ? 'right' : dir;
                desenharPersonagem(g, look, view, f);
                if (dir === 'left') g = g.mirrored();
                g = g.padded(1).outline();
                g.drawTo(ctx, f * SPRITE_W, r * SPRITE_H);
            }
        });
        this.cache.set(key, sheet);
        return sheet;
    },

    // Retrato grande (busto 32x32) usado nas conversas e nos desafios
    retrato(look) {
        const key = 'r' + JSON.stringify(look);
        if (this.cache.has(key)) return this.cache.get(key);
        const g = new Grid(32, 32);
        desenharRetrato(g, look);
        const c = g.padded(1).outline().toCanvas();
        this.cache.set(key, c);
        return c;
    },

    // Retrato já ampliado como imagem (para usar no HTML)
    retratoURL(look, escala = 8) {
        const key = 'u' + escala + JSON.stringify(look);
        if (this.cache.has(key)) return this.cache.get(key);
        const src = this.retrato(look);
        const c = document.createElement('canvas');
        c.width = src.width * escala; c.height = src.height * escala;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(src, 0, 0, c.width, c.height);
        const url = c.toDataURL();
        this.cache.set(key, url);
        return url;
    },

    personagemURL(look, dir = 'down', escala = 6) {
        const key = 'pu' + dir + escala + JSON.stringify(look);
        if (this.cache.has(key)) return this.cache.get(key);
        const sheet = this.personagem(look);
        const c = document.createElement('canvas');
        c.width = SPRITE_W * escala; c.height = SPRITE_H * escala;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sheet, 0, DIRECOES.indexOf(dir) * SPRITE_H, SPRITE_W, SPRITE_H, 0, 0, c.width, c.height);
        const url = c.toDataURL();
        this.cache.set(key, url);
        return url;
    },
};

function paleta(L) {
    const p = {
        pele: L.pele, peleS: Cor.shade(L.pele, -0.16), peleL: Cor.shade(L.pele, 0.22),
        cab: L.corCabelo, cabS: Cor.shade(L.corCabelo, -0.3), cabL: Cor.shade(L.corCabelo, 0.28),
        roupa: L.corRoupa, roupaS: Cor.shade(L.corRoupa, -0.22), roupaL: Cor.shade(L.corRoupa, 0.2),
        roupa2: L.corRoupa2 || '#f4f1ea',
        calca: L.corCalca || '#3b4a6b', calcaS: Cor.shade(L.corCalca || '#3b4a6b', -0.25),
        sapato: L.corSapato || '#3a2b26',
        olho: '#2a1c1c',
        boina: L.corBoina || '#8b2f3c',
    };
    p.roupa2S = Cor.shade(p.roupa2, -0.18);
    return p;
}

function desenharPersonagem(g, L, view, f) {
    const P = paleta(L);
    const roupa = L.roupa || 'camisa';
    const acc = L.acessorios || [];

    // ---------- Pernas e sapatos ----------
    const curtas = roupa === 'esporte';
    const vestido = roupa === 'vestido';
    const pernaCor = y => {
        if (vestido) return P.peleS;
        if (curtas) return y <= 19 ? P.calca : P.pele;
        return y === 21 ? P.calcaS : P.calca;
    };
    const sapato = curtas ? '#f2f2f2' : P.sapato;
    const sapatoS = curtas ? '#b9c0c9' : Cor.shade(P.sapato, -0.35);

    if (view === 'down' || view === 'up') {
        const lift = [f === 1 ? 1 : 0, f === 2 ? 1 : 0];
        [[0, 5], [1, 8]].forEach(([i, x0]) => {
            const fim = 21 - lift[i];
            for (let y = 19; y <= fim; y++) g.row(y, x0, x0 + 2, pernaCor(y));
            g.row(fim + 1, x0, x0 + 2, sapato);
            g.row(fim + 2, x0, x0 + 2, sapatoS);
        });
        if (!vestido) g.row(18, 5, 10, curtas ? P.calca : P.calcaS);
    } else {
        // lateral (virado para a direita)
        if (f === 0) {
            for (let y = 19; y <= 21; y++) g.row(y, 6, 9, pernaCor(y));
            g.row(22, 6, 10, sapato); g.row(23, 6, 10, sapatoS);
        } else {
            const tras = f === 1 ? 5 : 6, frente = f === 1 ? 9 : 8;
            for (let y = 19; y <= 21; y++) { g.row(y, tras, tras + 2, Cor.shade(pernaCor(y), -0.15)); }
            g.row(22, tras - 1, tras + 1, sapatoS); g.row(23, tras - 1, tras + 1, sapatoS);
            for (let y = 19; y <= 21; y++) g.row(y, frente - 1, frente + 1, pernaCor(y));
            g.row(22, frente - 1, frente + 2, sapato); g.row(23, frente - 1, frente + 2, sapatoS);
        }
        if (!vestido) g.row(18, 6, 9, curtas ? P.calca : P.calcaS);
    }

    // ---------- Tronco ----------
    const corpo = roupa === 'jaleco' ? '#f3f5f7' : P.roupa;
    const corpoS = roupa === 'jaleco' ? '#c9d2dc' : P.roupaS;
    const x0 = view === 'right' ? 5 : 4, x1 = view === 'right' ? 10 : 11;
    for (let y = 12; y <= 17; y++) g.row(y, x0, x1, corpo);
    g.row(17, x0, x1, corpoS);
    g.col(x1, 13, 17, corpoS);
    if (roupa === 'jaleco') { // jaleco desce mais
        g.row(18, x0, x1, corpo); g.row(19, x0, x0 + 1, corpoS); g.row(19, x1 - 1, x1, corpoS);
    }
    if (vestido) {
        for (let y = 17; y <= 20; y++) g.row(y, x0 - (y > 18 ? 1 : 0), x1 + (y > 18 ? 1 : 0), y === 20 ? P.roupaS : P.roupa);
    }

    if (view === 'down') {
        // gola / detalhes da frente
        g.pts([[7, 12], [8, 12]], P.peleS);
        if (roupa === 'jaleco') { g.col(7, 13, 16, P.roupa); g.col(8, 13, 16, P.roupa); g.col(6, 12, 18, '#d5dce4'); g.col(9, 12, 18, '#d5dce4'); }
        if (roupa === 'blazer') { g.col(7, 13, 17, P.roupa2); g.col(8, 13, 17, P.roupa2); g.pts([[6, 13], [9, 13]], P.roupaL); }
        if (roupa === 'polo') { g.pts([[6, 12], [9, 12]], P.roupaL); g.col(8, 13, 14, P.roupaS); }
        if (roupa === 'esporte') { g.row(14, 4, 11, P.roupa2); g.pts([[7, 12], [8, 12]], P.roupa2); }
        if (roupa === 'avental') { g.rect(5, 14, 6, 5, P.roupa2); g.pts([[6, 15], [9, 16], [7, 17]], '#e14b4b'); g.pts([[8, 15], [6, 17]], '#3d7be0'); g.pts([[9, 18]], '#f2c230'); }
        if (acc.includes('gravata')) { g.col(7, 13, 16, P.roupa2); g.col(8, 13, 16, P.roupa2); g.pts([[7, 16]], Cor.shade(P.roupa2, -0.3)); }
        if (acc.includes('apito')) { g.pts([[6, 13], [7, 14], [9, 13], [8, 14]], '#2c2c34'); g.pts([[8, 15]], '#cfd6de'); }
        if (acc.includes('colar')) g.pts([[6, 13], [7, 14], [8, 14], [9, 13]], '#f2c94c');
    }
    if (view === 'up' && roupa === 'esporte') g.row(14, 4, 11, P.roupa2);

    // ---------- Braços ----------
    const manga = roupa === 'jaleco' ? '#e7ecf1' : P.roupa;
    if (view === 'down' || view === 'up') {
        const sw = f === 1 ? [-1, 1] : f === 2 ? [1, -1] : [0, 0];
        [[3, sw[0]], [12, sw[1]]].forEach(([x, d]) => {
            const t = 13 + d;
            g.col(x, t, t + 1, manga);
            g.col(x, t + 2, t + 3, P.pele);
            g.set(x, t + 3, P.peleS);
        });
    } else {
        const ax = f === 1 ? 8 : f === 2 ? 6 : 7;
        g.col(ax, 13, 14, Cor.shade(manga, -0.08)); g.col(ax + 1, 13, 14, manga);
        g.col(ax, 15, 16, P.peleS); g.col(ax + 1, 15, 16, P.pele);
    }

    // ---------- Cabeça ----------
    if (view === 'right') {
        g.rect(4, 3, 9, 9, P.pele);
        g.pts([[4, 3], [12, 3], [4, 11], [12, 11]], null);
        g.row(11, 6, 11, P.peleS);
        g.set(13, 8, P.pele);             // nariz
        g.pts([[10, 7], [10, 8]], P.olho);
        g.set(7, 8, P.peleS);              // orelha
    } else {
        g.rect(3, 3, 10, 9, P.pele);
        g.pts([[3, 3], [12, 3], [3, 11], [12, 11]], null);
        g.col(12, 5, 10, P.peleS);
        g.row(11, 4, 11, P.peleS);
        if (view === 'down') {
            g.pts([[5, 7], [5, 8], [10, 7], [10, 8]], P.olho);
            if (L.blush) g.pts([[4, 9], [11, 9]], Cor.mix(P.pele, '#e0606a', 0.4));
        }
    }

    desenharCabeloMapa(g, L, P, view);

    if (view !== 'up') desenharRostoMapa(g, L, P, view);
    if (acc.includes('boina')) desenharBoinaMapa(g, P, view);
    if (acc.includes('bone')) desenharBoneMapa(g, P, view);
}

function desenharRostoMapa(g, L, P, view) {
    const acc = L.acessorios || [];
    if (view === 'down') {
        if (L.oculos) {
            g.row(6, 4, 6, '#2b2b33'); g.row(6, 9, 11, '#2b2b33');
            g.pts([[4, 7], [6, 7], [9, 7], [11, 7], [7, 7], [8, 7]], '#2b2b33');
            g.pts([[4, 8], [6, 8], [9, 8], [11, 8]], Cor.mix(P.pele, '#9fd0ff', 0.45));
        }
        if (L.barba === 'cheia') { g.row(10, 4, 11, P.cab); g.row(11, 5, 10, P.cabS); g.pts([[3, 9], [12, 9], [3, 10], [12, 10], [4, 9], [11, 9]], P.cab); g.pts([[7, 10], [8, 10]], Cor.shade(P.cab, 0.2)); }
        if (L.barba === 'cavanhaque') { g.row(10, 6, 9, P.cab); g.row(11, 7, 8, P.cabS); }
        if (L.barba === 'bigode') g.row(9, 6, 9, P.cab);
        if (acc.includes('brincos')) g.pts([[3, 10], [12, 10]], '#f2c94c');
    } else {
        if (L.oculos) { g.pts([[9, 6], [10, 6], [11, 6], [12, 6], [8, 7], [9, 7], [11, 7]], '#2b2b33'); }
        if (L.barba === 'cheia') { g.row(10, 7, 12, P.cab); g.row(11, 7, 11, P.cabS); g.col(7, 8, 10, P.cab); }
        if (L.barba === 'cavanhaque') { g.row(10, 10, 12, P.cab); g.set(11, 11, P.cabS); }
        if (L.barba === 'bigode') g.row(9, 11, 12, P.cab);
        if (acc.includes('brincos')) g.set(7, 10, '#f2c94c');
    }
}

function desenharCabeloMapa(g, L, P, view) {
    const H = P.cab, S = P.cabS, Lt = P.cabL;
    const st = L.cabelo || 'curto';

    if (st === 'careca') {
        if (view === 'down') { g.col(3, 6, 8, H); g.col(12, 6, 8, S); g.pts([[5, 4], [6, 4]], P.peleL); }
        if (view === 'up') { g.row(8, 3, 12, H); g.row(9, 3, 12, H); g.row(10, 4, 11, S); g.pts([[6, 4], [7, 4]], P.peleL); }
        if (view === 'right') { g.col(4, 5, 9, H); g.col(5, 6, 9, H); g.col(6, 7, 9, S); g.pts([[8, 4], [9, 4]], P.peleL); }
        return;
    }

    const volumoso = st === 'cacheado' || st === 'crespo';
    const comprido = st === 'longo' || st === 'ondulado' || st === 'cacheado';
    const fimLong = st === 'longo' ? 15 : st === 'cacheado' ? 14 : 13;

    if (view === 'down') {
        if (comprido) { // mechas atrás dos ombros
            for (let y = 5; y <= fimLong; y++) { g.set(2, y, S); g.set(13, y, S); }
            if (volumoso) for (let y = 4; y <= fimLong - 1; y++) { g.set(1, y, (y % 2) ? S : null); g.set(14, y, (y % 2) ? null : S); }
        }
        g.row(2, 4, 11, H);
        g.row(3, 3, 12, H); g.row(4, 3, 12, H);
        if (volumoso) { g.row(1, 4, 11, H); g.row(2, 2, 13, H); g.row(3, 2, 13, H); g.pts([[3, 1], [12, 1], [5, 0], [8, 0], [10, 0]], H); }
        if (st === 'rabo' || st === 'coque') {
            g.row(5, 3, 3, H); g.row(5, 12, 12, H); g.col(3, 6, 7, H); g.col(12, 6, 7, S);
        } else if (st === 'crespo') {
            g.row(5, 3, 3, H); g.row(5, 12, 12, H);
        } else {
            g.pts([[3, 5], [4, 5], [5, 5], [7, 5], [8, 5], [10, 5], [11, 5], [12, 5]], H);
            g.pts([[4, 6], [8, 6], [11, 6]], H);
            g.col(3, 6, comprido ? 10 : 7, H); g.col(12, 6, comprido ? 10 : 7, S);
            if (comprido) { g.col(2, 4, 12, H); g.col(13, 4, 12, S); }
        }
        if (st === 'espetado') g.pts([[4, 1], [6, 0], [6, 1], [8, 1], [9, 0], [9, 1], [11, 1], [2, 3], [13, 3]], H);
        if (st === 'coque') { g.row(0, 6, 9, H); g.row(1, 5, 10, H); g.pts([[7, 0]], Lt); }
        g.pts([[5, 3], [6, 3], [6, 2]], Lt);
    }

    if (view === 'up') {
        g.row(2, 4, 11, H);
        for (let y = 3; y <= 9; y++) g.row(y, 3, 12, H);
        g.row(10, 4, 11, S);
        if (volumoso) { g.row(1, 4, 11, H); for (let y = 2; y <= 11; y++) g.row(y, 2, 13, H); g.pts([[5, 0], [8, 0], [10, 0], [3, 1], [12, 1]], H); }
        if (comprido) { for (let y = 10; y <= fimLong; y++) g.row(y, 3, 12, y === fimLong ? S : H); g.col(2, 5, fimLong - 1, S); g.col(13, 5, fimLong - 1, S); }
        if (st === 'rabo') { g.rect(6, 10, 4, 4, H); g.row(14, 7, 8, S); g.row(10, 6, 9, '#d04f6a'); }
        if (st === 'coque') { g.row(1, 6, 9, H); g.row(0, 6, 9, H); g.row(2, 5, 10, H); }
        if (st === 'espetado') g.pts([[4, 1], [6, 1], [8, 1], [11, 1], [2, 4], [13, 4]], H);
        g.pts([[6, 3], [7, 3], [6, 4]], Lt);
        g.col(12, 4, 9, S);
    }

    if (view === 'right') {
        g.row(2, 5, 11, H);
        g.row(3, 4, 12, H); g.row(4, 4, 12, H);
        if (volumoso) { g.row(1, 5, 11, H); g.row(2, 3, 12, H); g.row(3, 3, 13, H); g.pts([[6, 0], [9, 0], [4, 1]], H); }
        if (st === 'rabo' || st === 'coque' || st === 'crespo') g.pts([[11, 5], [12, 5]], H);
        else g.pts([[9, 5], [11, 5], [12, 5], [12, 6]], H);
        for (let y = 5; y <= 9; y++) g.row(y, 4, y < 7 ? 7 : 6, y === 9 ? S : H);
        if (volumoso) for (let y = 4; y <= 11; y++) g.row(y, 2, 6, (y + 1) % 3 ? H : S);
        if (comprido) for (let y = 8; y <= fimLong; y++) g.row(y, 4, 7, y === fimLong ? S : H);
        if (st === 'rabo') { g.rect(1, 5, 3, 7, H); g.col(1, 9, 12, S); g.set(2, 12, S); g.col(3, 5, 6, '#d04f6a'); }
        if (st === 'coque') { g.rect(3, 0, 4, 3, H); g.set(4, 0, P.cabL); }
        if (st === 'espetado') g.pts([[5, 1], [7, 0], [7, 1], [9, 1], [11, 1], [3, 3], [13, 3]], H);
        g.pts([[8, 3], [9, 3]], Lt);
    }
}

function desenharBoinaMapa(g, P, view) {
    const c = P.boina, s = Cor.shade(c, -0.3);
    if (view === 'right') { g.row(1, 5, 11, c); g.row(2, 4, 13, c); g.row(3, 4, 13, s); g.set(8, 0, s); }
    else { g.row(1, 4, 11, c); g.row(2, 2, 13, c); g.row(3, 3, 12, s); g.set(7, 0, s); }
}

function desenharBoneMapa(g, P, view) {
    const c = P.roupa2, s = Cor.shade(c, -0.3);
    if (view === 'down') { g.row(2, 4, 11, c); g.row(3, 3, 12, c); g.row(4, 3, 12, s); g.row(5, 4, 11, s); }
    if (view === 'up') { g.row(2, 4, 11, c); g.row(3, 3, 12, c); g.row(4, 3, 12, c); g.row(5, 3, 12, s); }
    if (view === 'right') { g.row(2, 5, 11, c); g.row(3, 4, 12, c); g.row(4, 4, 12, s); g.row(5, 10, 14, s); }
}

// =========================================================================
// RETRATO 32x32
// =========================================================================

function desenharRetrato(g, L) {
    const P = paleta(L);
    const roupa = L.roupa || 'camisa';
    const acc = L.acessorios || [];
    const st = L.cabelo || 'curto';
    const fem = L.genero === 'f';

    // ----- cabelo de trás (fica atrás da cabeça e dos ombros) -----
    const atras = () => {
        const H = P.cab, S = P.cabS;
        if (st === 'longo') {
            for (let y = 7; y <= 30; y++) { g.row(y, 5, 9, y > 27 ? S : H); g.row(y, 22, 26, y > 27 ? S : H); }
            g.col(5, 8, 30, S); g.col(26, 8, 30, S);
        }
        if (st === 'ondulado') {
            for (let y = 7; y <= 26; y++) { const w = (y % 4 < 2) ? 0 : 1; g.row(y, 5 - w, 9, H); g.row(y, 22, 26 + w, H); }
            g.row(26, 5, 9, S); g.row(26, 22, 26, S);
        }
        if (st === 'cacheado') {
            for (let y = 2; y <= 26; y++) {
                const b = (y % 3 === 0) ? 1 : 0;
                g.row(y, 3 - b + (y < 5 ? 3 : 0), 28 + b - (y < 5 ? 3 : 0), (y + 1) % 4 === 0 ? S : H);
            }
            g.row(27, 6, 9, S); g.row(27, 22, 25, S);
        }
        if (st === 'rabo') {
            for (let y = 8; y <= 24; y++) g.row(y, 23 + (y > 14 ? 1 : 0), 27 - (y > 20 ? 1 : 0), y > 21 ? S : H);
            g.rect(23, 7, 3, 2, '#d04f6a');
        }
        if (st === 'coque') { g.row(0, 13, 18, H); for (let y = 1; y <= 4; y++) g.row(y, 12, 19, H); g.pts([[14, 1], [15, 1]], P.cabL); }
        if (st === 'crespo') {
            for (let y = 0; y <= 13; y++) {
                const w = y < 2 ? 5 : y < 4 ? 8 : 10;
                g.row(y, 15 - w, 16 + w, H);
            }
            for (let i = 0; i < 40; i++) g.set(6 + ((i * 7) % 20), 1 + ((i * 5) % 12), S);
        }
    };
    atras();

    // ----- corpo / roupa -----
    const corpo = roupa === 'jaleco' ? '#f3f5f7' : P.roupa;
    const corpoS = roupa === 'jaleco' ? '#c9d2dc' : P.roupaS;
    g.row(24, 8, 23, corpo); g.row(25, 6, 25, corpo);
    for (let y = 26; y <= 31; y++) g.row(y, 4, 27, corpo);
    g.col(4, 27, 31, corpoS); g.col(27, 27, 31, corpoS); g.col(26, 26, 31, corpoS);
    // pescoço
    g.rect(13, 20, 6, 5, P.peleS);
    g.row(24, 13, 18, P.peleS);

    if (roupa === 'camisa' || roupa === 'polo') {
        g.pts([[12, 24], [13, 25], [11, 25], [12, 26], [19, 24], [18, 25], [20, 25], [19, 26]], roupa === 'polo' ? P.roupaL : P.roupa2);
        g.pts([[14, 25], [15, 26], [16, 26], [17, 25]], P.peleS);
        if (roupa === 'polo') g.col(16, 27, 29, P.roupaS);
    }
    if (roupa === 'jaleco' || roupa === 'blazer') {
        const dentro = roupa === 'jaleco' ? P.roupa : P.roupa2;
        for (let y = 24; y <= 31; y++) { const w = Math.max(0, 3 - Math.floor((y - 24) / 3)); g.row(y, 15 - w, 16 + w, dentro); }
        const lap = roupa === 'jaleco' ? '#cbd3dd' : P.roupaS;
        for (let y = 25; y <= 31; y++) { g.set(15 - Math.max(0, 3 - Math.floor((y - 24) / 3)) - 1, y, lap); g.set(16 + Math.max(0, 3 - Math.floor((y - 24) / 3)) + 1, y, lap); }
        if (roupa === 'jaleco') g.pts([[8, 29], [9, 29], [10, 29]], '#9fb0c2');
    }
    if (roupa === 'esporte') {
        g.row(25, 12, 19, P.roupa2); g.row(26, 13, 18, P.roupa2);
        g.row(29, 4, 27, P.roupa2);
        g.pts([[14, 25], [15, 25], [16, 25], [17, 25]], P.peleS);
    }
    if (roupa === 'vestido') { // blusa com decote redondo
        g.row(25, 12, 19, P.peleS); g.row(26, 13, 18, P.peleS);
        g.row(27, 14, 17, P.roupaL);
    }
    if (roupa === 'avental') {
        g.pts([[12, 24], [13, 25], [19, 24], [18, 25]], P.roupaL);
        g.col(10, 25, 31, P.roupa2); g.col(21, 25, 31, P.roupa2);
        g.rect(10, 28, 12, 4, P.roupa2);
        g.pts([[12, 29], [17, 30], [20, 28]], '#e14b4b'); g.pts([[14, 30], [19, 30]], '#3d7be0'); g.pts([[15, 29], [11, 31]], '#f2c230'); g.pts([[18, 29]], '#46b05a');
    }
    if (acc.includes('gravata')) { g.row(25, 15, 16, Cor.shade(P.roupa2, -0.2)); g.rect(15, 26, 2, 5, P.roupa2); g.row(31, 15, 16, Cor.shade(P.roupa2, -0.2)); g.set(14, 30, P.roupa2); g.set(17, 30, P.roupa2); }
    if (acc.includes('colar')) g.pts([[12, 25], [13, 26], [14, 27], [15, 27], [16, 27], [17, 27], [18, 26], [19, 25]], '#f2c94c');
    if (acc.includes('apito')) { g.pts([[12, 25], [13, 26], [13, 27], [14, 28], [19, 25], [18, 26], [18, 27], [17, 28]], '#2c2c34'); g.rect(14, 29, 3, 2, '#d7dee6'); g.set(16, 29, '#ffffff'); }
    if (acc.includes('cachecol')) { g.row(23, 11, 20, P.roupa2); g.row(24, 10, 21, P.roupa2); g.rect(18, 25, 3, 5, P.roupa2); g.col(19, 25, 29, Cor.shade(P.roupa2, -0.2)); }

    // ----- cabeça -----
    const linhas = { 5: [11, 20], 6: [9, 22], 18: [9, 22], 19: [10, 21], 20: [11, 20], 21: [13, 18] };
    for (let y = 5; y <= 21; y++) {
        const [a, b] = linhas[y] || [8, 23];
        g.row(y, a, b, P.pele);
    }
    // sombra lateral e do queixo
    for (let y = 7; y <= 17; y++) g.set(23, y, P.peleS);
    g.pts([[22, 18], [21, 19], [20, 20], [18, 21], [17, 21]], P.peleS);
    // orelhas
    g.col(7, 12, 15, P.pele); g.col(24, 12, 15, P.peleS); g.set(7, 13, P.peleS); g.set(24, 13, Cor.shade(P.pele, -0.3));

    // olhos
    [[11, 12], [19, 20]].forEach(([a, b]) => {
        g.rect(a, 12, 2, 3, P.olho);
        g.set(a, 12, '#ffffff');
        if (fem) { g.set(a - 1, 12, P.olho); g.set(b + 1, 11, P.olho); }
    });
    // sobrancelhas
    const sob = Cor.shade(L.cabelo === 'careca' && !L.corSobrancelha ? '#5a4636' : P.cab, -0.15);
    if (fem) { g.row(10, 10, 13, sob); g.row(10, 18, 21, sob); }
    else { g.row(10, 10, 13, sob); g.row(10, 18, 21, sob); g.row(9, 11, 12, sob); g.row(9, 19, 20, sob); }
    // nariz e boca
    g.pts([[16, 15], [16, 16], [15, 17]], P.peleS);
    const boca = fem ? '#b54a5a' : '#8a4a42';
    g.pts([[13, 18], [14, 19], [15, 19], [16, 19], [17, 19], [18, 18]], boca);
    if (fem || L.blush) g.pts([[10, 17], [11, 17], [20, 17], [21, 17]], Cor.mix(P.pele, '#e0606a', 0.35));

    // ----- barba -----
    if (L.barba === 'cheia') {
        const B = P.cab, BS = P.cabS;
        for (let y = 15; y <= 21; y++) { const [a, b] = linhas[y] || [8, 23]; g.row(y, a, b, y > 19 ? BS : B); }
        g.col(8, 11, 15, B); g.col(23, 11, 15, BS);
        g.row(16, 9, 22, P.pele); g.row(15, 9, 22, P.pele);
        g.pts([[16, 15], [16, 16]], P.peleS);
        g.row(17, 12, 19, B);
        g.row(18, 13, 18, '#7a3c38'); g.row(19, 14, 17, Cor.mix(B, '#7a3c38', 0.4));
    }
    if (L.barba === 'cavanhaque') {
        g.row(17, 12, 19, P.cab);
        g.pts([[13, 18], [18, 18]], P.cab);
        g.row(20, 14, 17, P.cab); g.row(21, 14, 17, P.cabS);
    }
    if (L.barba === 'bigode') { g.row(17, 12, 19, P.cab); g.pts([[12, 18], [19, 18]], P.cab); }

    // ----- óculos -----
    if (L.oculos) {
        const F = L.corOculos || '#25252d', lente = Cor.mix(P.pele, '#bfe3ff', 0.5);
        [[9, 14], [17, 22]].forEach(([a, b]) => {
            g.row(11, a, b, F); g.row(15, a, b, F); g.col(a, 11, 15, F); g.col(b, 11, 15, F);
            for (let y = 12; y <= 14; y++) for (let x = a + 1; x < b; x++) if (g.get(x, y) === P.pele || g.get(x, y) === P.peleS) g.set(x, y, lente);
        });
        g.row(12, 15, 16, F); g.set(8, 12, F); g.set(23, 12, F);
    }

    // ----- cabelo da frente -----
    const H = P.cab, S = P.cabS, Lt = P.cabL;
    if (st === 'careca') {
        g.col(8, 10, 16, H); g.col(7, 10, 11, H); g.col(9, 10, 12, H);
        g.col(23, 10, 16, S); g.col(24, 10, 11, S); g.col(22, 10, 12, S);
        g.pts([[12, 6], [13, 6], [14, 6], [11, 7], [12, 7]], P.peleL);
        g.pts([[17, 6], [18, 6]], Cor.shade(P.pele, 0.1));
    } else if (st === 'crespo') {
        for (let y = 3; y <= 8; y++) g.row(y, 7, 24, H);
        g.col(7, 9, 12, H); g.col(24, 9, 12, S); g.row(9, 8, 9, H); g.row(9, 22, 23, S);
        for (let i = 0; i < 18; i++) g.set(8 + ((i * 5) % 16), 3 + ((i * 3) % 6), S);
        g.pts([[11, 3], [12, 3], [12, 4]], Lt);
    } else {
        g.row(2, 11, 20, H); g.row(3, 9, 22, H);
        for (let y = 4; y <= 7; y++) g.row(y, 7, 24, H);
        g.row(8, 7, 24, H);
        if (st === 'rabo' || st === 'coque') {
            g.row(8, 10, 21, null); g.row(8, 10, 21, P.pele);
            g.row(7, 10, 13, S); g.row(7, 17, 19, S);
            g.col(7, 8, 12, H); g.col(8, 8, 10, H); g.col(24, 8, 12, S); g.col(23, 8, 10, S);
            g.pts([[15, 3], [16, 4], [17, 5], [12, 4], [11, 5]], Lt);
        } else {
            // franja recortada
            g.pts([[10, 9], [11, 9], [13, 9], [14, 9], [17, 9], [20, 9], [21, 9], [22, 9], [9, 9], [8, 9]], H);
            g.pts([[10, 10], [14, 10], [21, 10]], H);
            g.col(7, 9, 14, H); g.col(8, 9, 12, H);
            g.col(24, 9, 14, S); g.col(23, 9, 12, S);
            if (st === 'longo' || st === 'ondulado' || st === 'cacheado') { g.col(7, 9, 22, H); g.col(8, 9, 19, H); g.col(24, 9, 22, S); g.col(23, 9, 19, S); g.col(6, 8, 23, H); g.col(25, 8, 23, S); }
            g.pts([[12, 3], [13, 3], [11, 4], [12, 4], [10, 5]], Lt);
            g.row(8, 15, 16, S);
        }
        if (st === 'cacheado') {
            g.row(1, 12, 19, H); g.row(2, 9, 22, H); g.row(3, 7, 24, H);
            g.pts([[9, 10], [12, 10], [16, 10], [19, 10], [22, 10], [6, 6], [25, 6], [5, 9], [26, 9]], H);
            for (let i = 0; i < 16; i++) g.set(7 + ((i * 7) % 18), 2 + ((i * 3) % 7), S);
        }
        if (st === 'espetado') {
            g.pts([[10, 1], [10, 2], [13, 0], [13, 1], [16, 0], [16, 1], [19, 1], [19, 2], [22, 2], [8, 2], [6, 4], [25, 4]], H);
            g.pts([[13, 0], [16, 0]], Lt);
        }
    }

    if (acc.includes('boina')) {
        const c = P.boina, s = Cor.shade(c, -0.3);
        g.row(1, 10, 21, c); g.row(2, 7, 24, c); g.row(3, 6, 26, c); g.row(4, 6, 26, c); g.row(5, 7, 25, s);
        g.pts([[15, 0], [16, 0]], s); g.pts([[11, 2], [12, 2]], Cor.shade(c, 0.2));
    }
    if (acc.includes('bone')) {
        const c = P.roupa2, s = Cor.shade(c, -0.3);
        g.row(1, 11, 20, c); g.row(2, 9, 22, c); for (let y = 3; y <= 7; y++) g.row(y, 7, 24, c);
        g.row(8, 6, 25, s); g.row(9, 7, 24, Cor.shade(c, -0.45));
    }
    if (acc.includes('tiara')) { g.row(5, 8, 23, L.corTiara || '#e05a7a'); g.row(4, 9, 22, Cor.shade(L.corTiara || '#e05a7a', 0.25)); }
    if (acc.includes('brincos')) { g.set(7, 16, '#f2c94c'); g.set(24, 16, '#d9a830'); g.set(7, 17, '#f2c94c'); }
}
