// =========================================================================
// CENÁRIO EM PIXEL ART: chão (tiles 16x16) e objetos (árvores, carteiras...)
// =========================================================================

const TILE = 16;

// Aleatório "fixo" por posição: o mapa sai sempre igual
function hash(x, y, s = 0) {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// -------------------------------------------------------------------------
// Fonte de pixel 3x5 (placas, quadro-negro, letreiros)
// -------------------------------------------------------------------------
const FONTE_3x5 = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
    4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
    9: '111101111001110', '+': '000010111010000', '-': '000000111000000', '=': '000111000111000', '.': '000000000000010',
    ':': '000010000010000', '!': '010010010000010', '?': '110001010000010', '/': '001001010100100', '²': '110010100110000',
    '(': '010100100100010', ')': '010001001001010', '·': '000000010000000', 'π': '000111101101101', ' ': '000000000000000',
    'Ç': '011100100011010', 'Ã': '011110010101101', 'É': '010111110100111', 'Á': '010111101111101', 'Í': '010111010010111',
    'Ó': '010111101101010', 'Ú': '010101101101111', 'Ê': '010101111100111', 'Õ': '011110010101010', ',': '000000000010100',
    '>': '100010001010100', '<': '001010100010001', '*': '000101010101000', '%': '101001010100101', "'": '010010000000000',
};

function textoPixel(ctx, texto, x, y, cor, escala = 1) {
    ctx.fillStyle = cor;
    let cx = x;
    for (const ch of texto.toUpperCase()) {
        const g = FONTE_3x5[ch] || FONTE_3x5['?'];
        for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(cx + (i % 3) * escala, y + Math.floor(i / 3) * escala, escala, escala);
        cx += 4 * escala;
    }
}
const larguraTextoPixel = (t, e = 1) => t.length * 4 * e - e;

// -------------------------------------------------------------------------
// TILES DO CHÃO
// -------------------------------------------------------------------------
const PAL = {
    grama: '#6cbf4c', gramaE: '#59a83f', gramaC: '#86d260', gramaT: '#4a9236',
    pedra: '#e6dcc4', pedraE: '#cdbf9f', pedraC: '#f3ecdb',
    calcada: '#d9c6a3', calcadaE: '#bea782',
    terra: '#9a6a42', terraE: '#7c5233', terraC: '#b07d50',
    quadra: '#e48a3c', quadraE: '#d37b31', linha: '#f8f0e0',
    cerca: '#3f8f3c', cercaE: '#2e6d2f', cercaC: '#5bab4a', cercaCC: '#79c35e',
    pisoA: '#e6e1d5', pisoB: '#d6cfbf', rejunte: '#c3bba9',
    madeira: '#c58e58', madeiraE: '#a97343', madeiraC: '#d6a068',
    paredeTopo: '#3f3550', paredeBorda: '#685a80',
    paredeCreme: '#f1e6cd', paredeCremeE: '#dfcfae', rodape: '#5b4636',
    lambri: '#6fae84', lambriE: '#5a9470', lambriC: '#8cc49d',
    tapete: '#b9434b', tapeteE: '#93323b', tapeteBorda: '#e6b24c',
};

const Tiles = {
    // Gera a imagem inteira do chão do mapa (feito uma vez só)
    renderizar(mapa) {
        const c = document.createElement('canvas');
        c.width = mapa.w * TILE; c.height = mapa.h * TILE;
        const ctx = c.getContext('2d');
        const at = (x, y) => (mapa.chao[y] && mapa.chao[y][x]) || 'x';
        for (let y = 0; y < mapa.h; y++) for (let x = 0; x < mapa.w; x++) {
            const t = at(x, y);
            const f = this.tipos[t] || this.tipos.x;
            ctx.save(); ctx.translate(x * TILE, y * TILE);
            f(ctx, x, y, at);
            ctx.restore();
        }
        // sombras das paredes sobre o piso
        for (let y = 0; y < mapa.h; y++) for (let x = 0; x < mapa.w; x++) {
            const t = at(x, y);
            if (!SOLIDOS.has(t) && INTERNOS.has(t)) {
                ctx.fillStyle = 'rgba(40,25,50,0.18)';
                if (SOLIDOS.has(at(x, y - 1))) { ctx.fillRect(x * TILE, y * TILE, TILE, 4); ctx.fillRect(x * TILE, y * TILE, TILE, 2); }
                if (at(x - 1, y) === 'W') ctx.fillRect(x * TILE, y * TILE, 3, TILE);
                if (at(x + 1, y) === 'W') ctx.fillRect(x * TILE + TILE - 2, y * TILE, 2, TILE);
            }
        }
        return c;
    },

    tipos: {
        x(ctx) { ctx.fillStyle = '#16121e'; ctx.fillRect(0, 0, 16, 16); },

        '.'(ctx, x, y) { grama(ctx, x, y); },
        ','(ctx, x, y) {
            grama(ctx, x, y);
            const cores = ['#ffffff', '#ffd84a', '#ff8fb1', '#9ec8ff', '#ff6b5b'];
            for (let i = 0; i < 2; i++) {
                const fx = 2 + Math.floor(hash(x, y, 10 + i) * 11), fy = 2 + Math.floor(hash(x, y, 20 + i) * 11);
                const c = cores[Math.floor(hash(x, y, 30 + i) * cores.length)];
                ctx.fillStyle = PAL.gramaT; ctx.fillRect(fx, fy + 2, 1, 2);
                ctx.fillStyle = c; ctx.fillRect(fx - 1, fy, 3, 1); ctx.fillRect(fx, fy - 1, 1, 3);
                ctx.fillStyle = '#f7c833'; ctx.fillRect(fx, fy, 1, 1);
            }
        },
        '#'(ctx, x, y, at) {
            ctx.fillStyle = PAL.pedra; ctx.fillRect(0, 0, 16, 16);
            for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
                const v = hash(x * 2 + i, y * 2 + j, 3);
                ctx.fillStyle = v < 0.3 ? '#e0d4b9' : v > 0.8 ? '#ece4d0' : PAL.pedra;
                ctx.fillRect(i * 8, j * 8, 8, 8);
                ctx.fillStyle = PAL.pedraC; ctx.fillRect(i * 8, j * 8, 7, 1);
                ctx.fillStyle = PAL.pedraE; ctx.fillRect(i * 8 + 7, j * 8, 1, 8); ctx.fillRect(i * 8, j * 8 + 7, 8, 1);
                if (v > 0.9) { ctx.fillStyle = PAL.pedraE; ctx.fillRect(i * 8 + 2, j * 8 + 3, 2, 1); }
            }
            bordaCaminho(ctx, x, y, at, '#', '#b9a985');
        },
        '='(ctx, x, y, at) {
            ctx.fillStyle = PAL.calcada; ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = PAL.calcadaE;
            for (let j = 0; j < 4; j++) {
                ctx.fillRect(0, j * 4 + 3, 16, 1);
                const off = (j + y) % 2 ? 4 : 0;
                ctx.fillRect(off + 3, j * 4, 1, 3); ctx.fillRect(off + 11, j * 4, 1, 3);
            }
            if (hash(x, y, 2) > 0.7) { ctx.fillStyle = '#e6d6b6'; ctx.fillRect(5, 5, 3, 1); }
            bordaCaminho(ctx, x, y, at, '=', '#a99068');
        },
        s(ctx, x, y) {
            ctx.fillStyle = PAL.terra; ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = PAL.terraE; ctx.fillRect(0, 6, 16, 2); ctx.fillRect(0, 14, 16, 2);
            ctx.fillStyle = PAL.terraC; ctx.fillRect(0, 4, 16, 1); ctx.fillRect(0, 12, 16, 1);
            for (let i = 0; i < 5; i++) { ctx.fillStyle = hash(x, y, i) > 0.5 ? PAL.terraC : PAL.terraE; ctx.fillRect(Math.floor(hash(x, y, i + 9) * 15), Math.floor(hash(x, y, i + 19) * 15), 1, 1); }
        },
        q(ctx, x, y, at) {
            ctx.fillStyle = PAL.quadra; ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 6; i++) { ctx.fillStyle = PAL.quadraE; ctx.fillRect(Math.floor(hash(x, y, i) * 16), Math.floor(hash(x, y, i + 7) * 16), 1, 1); }
            ctx.fillStyle = PAL.linha;
            if (at(x, y - 1) !== 'q') ctx.fillRect(0, 1, 16, 1);
            if (at(x, y + 1) !== 'q') ctx.fillRect(0, 14, 16, 1);
            if (at(x - 1, y) !== 'q') ctx.fillRect(1, 0, 1, 16);
            if (at(x + 1, y) !== 'q') ctx.fillRect(14, 0, 1, 16);
        },
        H(ctx, x, y, at) {
            const cimaAberto = at(x, y - 1) !== 'H', baixoAberto = at(x, y + 1) !== 'H';
            ctx.fillStyle = PAL.cerca; ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 9; i++) {
                const bx = Math.floor(hash(x, y, i) * 14), by = Math.floor(hash(x, y, i + 30) * 12);
                ctx.fillStyle = PAL.cercaC; ctx.fillRect(bx, by, 3, 2); ctx.fillRect(bx + 1, by - 1, 1, 1);
                ctx.fillStyle = PAL.cercaE; ctx.fillRect(bx, by + 2, 3, 1);
            }
            if (cimaAberto) {
                ctx.fillStyle = PAL.cercaCC;
                for (let i = 0; i < 16; i += 4) { ctx.fillRect(i, 1, 3, 1); ctx.fillRect(i + 1, 0, 2, 1); }
                ctx.fillStyle = PAL.cercaC; ctx.fillRect(0, 2, 16, 1);
            }
            if (baixoAberto) {
                ctx.fillStyle = PAL.cercaE; ctx.fillRect(0, 11, 16, 5);
                ctx.fillStyle = '#245626'; ctx.fillRect(0, 14, 16, 2);
                for (let i = 1; i < 16; i += 4) { ctx.fillStyle = '#6b4a2b'; ctx.fillRect(i, 13, 1, 3); }
            }
        },

        // --- interiores ---
        W(ctx, x, y, at) {
            ctx.fillStyle = PAL.paredeTopo; ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = PAL.paredeBorda;
            if (at(x, y + 1) !== 'W' && at(x, y + 1) !== 'x') ctx.fillRect(0, 13, 16, 3);
            if (at(x, y - 1) !== 'W' && at(x, y - 1) !== 'x') ctx.fillRect(0, 0, 16, 2);
            if (at(x - 1, y) !== 'W' && at(x - 1, y) !== 'x') ctx.fillRect(0, 0, 2, 16);
            if (at(x + 1, y) !== 'W' && at(x + 1, y) !== 'x') ctx.fillRect(14, 0, 2, 16);
            ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(3, 3, 10, 1);
        },
        F(ctx, x, y, at) {
            const superior = at(x, y - 1) !== 'F' && at(x, y - 1) !== 'd' && at(x, y - 1) !== 'D';
            paredeFace(ctx, superior);
        },
        d(ctx, x, y, at) { paredeFace(ctx, true); portaTopo(ctx); },
        D(ctx, x, y, at) { paredeFace(ctx, false); portaBaixo(ctx); },
        _(ctx, x, y) {
            const a = (x + y) % 2 === 0;
            ctx.fillStyle = a ? PAL.pisoA : PAL.pisoB; ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = PAL.rejunte; ctx.fillRect(15, 0, 1, 16); ctx.fillRect(0, 15, 16, 1);
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(2, 2, 3, 1); ctx.fillRect(2, 3, 1, 1);
        },
        p(ctx, x, y) {
            for (let j = 0; j < 4; j++) {
                const v = hash(x, y * 4 + j, 5);
                ctx.fillStyle = v < 0.33 ? PAL.madeiraE : v > 0.7 ? PAL.madeiraC : PAL.madeira;
                if (v >= 0.33) ctx.fillStyle = v > 0.7 ? '#cf9862' : PAL.madeira;
                ctx.fillRect(0, j * 4, 16, 4);
                ctx.fillStyle = PAL.madeiraE; ctx.fillRect(0, j * 4 + 3, 16, 1);
                const corte = Math.floor(hash(x, y * 4 + j, 6) * 14);
                ctx.fillRect(corte, j * 4, 1, 3);
                ctx.fillStyle = '#ddb07a'; ctx.fillRect((corte + 3) % 16, j * 4 + 1, 2, 1);
            }
        },
        r(ctx, x, y, at) {
            ctx.fillStyle = PAL.tapete; ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = PAL.tapeteE;
            for (let i = 0; i < 16; i += 4) for (let j = 0; j < 16; j += 4) if ((i + j) % 8 === 0) ctx.fillRect(i + 1, j + 1, 2, 2);
            ctx.fillStyle = PAL.tapeteBorda;
            if (at(x - 1, y) !== 'r') { ctx.fillRect(0, 0, 2, 16); ctx.fillStyle = PAL.tapeteE; ctx.fillRect(2, 0, 1, 16); ctx.fillStyle = PAL.tapeteBorda; }
            if (at(x + 1, y) !== 'r') { ctx.fillRect(14, 0, 2, 16); ctx.fillStyle = PAL.tapeteE; ctx.fillRect(13, 0, 1, 16); ctx.fillStyle = PAL.tapeteBorda; }
            if (at(x, y - 1) !== 'r') ctx.fillRect(0, 0, 16, 2);
            if (at(x, y + 1) !== 'r') ctx.fillRect(0, 14, 16, 2);
        },
        m(ctx, x, y) {
            Tiles.tipos._(ctx, x, y);
            ctx.fillStyle = '#5a4a44'; ctx.fillRect(1, 2, 14, 13);
            ctx.fillStyle = '#6f5c54'; for (let i = 3; i < 14; i += 2) ctx.fillRect(2, i, 12, 1);
            ctx.fillStyle = '#2f9e41'; ctx.fillRect(1, 2, 14, 1); ctx.fillRect(1, 14, 14, 1);
        },
    },
};

const SOLIDOS = new Set(['x', 'H', 'W', 'F', 'd']);
const INTERNOS = new Set(['_', 'p', 'r', 'm', 'D']);

function grama(ctx, x, y) {
    const n = hash(Math.floor(x / 3), Math.floor(y / 3), 1);
    ctx.fillStyle = n > 0.66 ? '#70c34f' : n < 0.33 ? '#68b949' : PAL.grama;
    ctx.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 7; i++) {
        const px = Math.floor(hash(x, y, i) * 16), py = Math.floor(hash(x, y, i + 50) * 16);
        ctx.fillStyle = hash(x, y, i + 90) > 0.5 ? PAL.gramaC : PAL.gramaE;
        ctx.fillRect(px, py, 1, 1);
    }
    if (hash(x, y, 77) > 0.55) { // tufinho
        const px = 2 + Math.floor(hash(x, y, 78) * 11), py = 3 + Math.floor(hash(x, y, 79) * 10);
        ctx.fillStyle = PAL.gramaT; ctx.fillRect(px, py, 1, 2); ctx.fillRect(px + 2, py, 1, 2); ctx.fillRect(px + 1, py + 1, 1, 2);
        ctx.fillStyle = PAL.gramaC; ctx.fillRect(px + 1, py - 1, 1, 1);
    }
}

function bordaCaminho(ctx, x, y, at, propria, cor) {
    const caminho = t => t === '#' || t === '=' || t === 'q';
    ctx.fillStyle = cor;
    if (!caminho(at(x, y - 1))) ctx.fillRect(0, 0, 16, 1);
    if (!caminho(at(x, y + 1))) { ctx.fillRect(0, 15, 16, 1); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 13, 16, 2); ctx.fillStyle = cor; }
    if (!caminho(at(x - 1, y))) ctx.fillRect(0, 0, 1, 16);
    if (!caminho(at(x + 1, y))) ctx.fillRect(15, 0, 1, 16);
}

function paredeFace(ctx, superior) {
    if (superior) {
        ctx.fillStyle = PAL.paredeCreme; ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = PAL.paredeCremeE; ctx.fillRect(0, 0, 16, 3);
        ctx.fillStyle = '#fbf4e4'; ctx.fillRect(0, 3, 16, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.035)'; ctx.fillRect(7, 4, 1, 12);
    } else {
        ctx.fillStyle = PAL.paredeCreme; ctx.fillRect(0, 0, 16, 5);
        ctx.fillStyle = PAL.lambriC; ctx.fillRect(0, 5, 16, 1);
        ctx.fillStyle = PAL.lambri; ctx.fillRect(0, 6, 16, 7);
        ctx.fillStyle = PAL.lambriE; ctx.fillRect(7, 7, 1, 6); ctx.fillRect(15, 7, 1, 6);
        ctx.fillStyle = PAL.rodape; ctx.fillRect(0, 13, 16, 3);
        ctx.fillStyle = '#7a604b'; ctx.fillRect(0, 13, 16, 1);
    }
}

function portaTopo(ctx) {
    ctx.fillStyle = '#5b3a24'; ctx.fillRect(1, 2, 14, 14);
    ctx.fillStyle = '#9a6538'; ctx.fillRect(3, 4, 10, 12);
    ctx.fillStyle = '#7c4d2a'; ctx.fillRect(3, 4, 10, 1);
    ctx.fillStyle = '#9fd6f2'; ctx.fillRect(5, 6, 6, 6);
    ctx.fillStyle = '#d6f1ff'; ctx.fillRect(5, 6, 2, 2);
    ctx.fillStyle = '#5b3a24'; ctx.fillRect(8, 6, 1, 6);
}

function portaBaixo(ctx) {
    ctx.fillStyle = '#5b3a24'; ctx.fillRect(1, 0, 14, 16);
    ctx.fillStyle = '#9a6538'; ctx.fillRect(3, 0, 10, 16);
    ctx.fillStyle = '#865631'; ctx.fillRect(4, 2, 8, 5); ctx.fillRect(4, 9, 8, 5);
    ctx.fillStyle = '#f2c94c'; ctx.fillRect(11, 7, 1, 2);
    ctx.fillStyle = '#3a2516'; ctx.fillRect(3, 15, 10, 1);
}

// -------------------------------------------------------------------------
// OBJETOS
// camada: 'y' (ordenado com os personagens), 'chao' e 'parede' (vão direto no chão)
// base: retângulo sólido relativo ao canto do objeto, ou lista de retângulos
// -------------------------------------------------------------------------

function obj(w, h, desenhar, opts = {}) {
    const g = new Grid(w, h);
    desenhar(g, opts);
    if (opts.contorno !== false) g.outline();
    return g.toCanvas();
}

const Objetos = {
    tipos: {
        arvore: {
            w: 34, h: 44, base: [12, 36, 10, 6], sombra: [17, 40, 13, 4],
            desenhar(g, o) {
                const v = o.variante || 0;
                const F = v ? ['#3c8f45', '#2d7339', '#5cb257', '#86cf6a'] : ['#3f9a3c', '#2f7a30', '#62b84a', '#8ed266'];
                // tronco
                g.rect(14, 28, 6, 13, '#7b5132'); g.col(19, 28, 40, '#5e3c24'); g.col(14, 30, 40, '#946540');
                g.pts([[12, 40], [13, 40], [20, 40], [21, 40]], '#6b4529');
                // copa
                const bolas = [[17, 13, 12], [10, 18, 8], [24, 18, 8], [17, 22, 10], [12, 9, 6], [22, 9, 6]];
                bolas.forEach(([cx, cy, r]) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) g.set(cx + x, cy + y, F[0]); });
                for (let y = 0; y < 34; y++) for (let x = 0; x < 34; x++) {
                    if (g.get(x, y) !== F[0]) continue;
                    if (!g.get(x, y + 2) || y > 26) g.set(x, y, F[1]);
                    else if (!g.get(x - 2, y - 2) || !g.get(x, y - 2)) g.set(x, y, F[2]);
                    if (hash(x, y, 9 + v) > 0.86) g.set(x, y, F[1]);
                }
                [[11, 8], [15, 6], [20, 7], [9, 14], [24, 13], [14, 12]].forEach(([x, y]) => { g.set(x, y, F[3]); g.set(x + 1, y, F[3]); g.set(x, y + 1, F[2]); });
                if (o.frutas) [[9, 20], [16, 16], [25, 21], [20, 25], [12, 26]].forEach(([x, y]) => { g.rect(x, y, 2, 2, '#ff7a3d'); g.set(x, y, '#ffc07a'); });
            },
        },
        arbusto: {
            w: 18, h: 16, base: [2, 8, 14, 6], sombra: [9, 14, 8, 2],
            desenhar(g, o) {
                for (let y = 2; y < 15; y++) for (let x = 1; x < 17; x++) {
                    const dx = (x - 8.5) / 8, dy = (y - 9) / 6.5;
                    if (dx * dx + dy * dy <= 1) g.set(x, y, y > 11 ? '#2f7a30' : (y < 6 ? '#62b84a' : '#3f9a3c'));
                }
                if (o.flores) [[4, 6], [9, 4], [13, 7], [7, 9], [12, 11]].forEach(([x, y]) => { g.set(x, y, o.flores); g.set(x + 1, y + 1, '#ffffff'); });
                g.pts([[6, 4], [7, 4], [11, 5]], '#8ed266');
            },
        },
        banco: {
            w: 32, h: 18, base: [1, 9, 30, 7], sombra: [16, 16, 14, 2],
            desenhar(g) {
                const M = '#c98b4a', ME = '#9e6634', MC = '#e2a964';
                g.rect(1, 2, 30, 3, M); g.row(2, 1, 30, MC); g.row(4, 1, 30, ME);   // encosto
                g.rect(1, 7, 30, 5, M); g.row(7, 1, 30, MC); g.row(9, 1, 30, ME); g.row(11, 1, 30, ME);
                g.col(3, 5, 6, '#4b4b55'); g.col(28, 5, 6, '#4b4b55');
                g.rect(3, 12, 2, 5, '#4b4b55'); g.rect(27, 12, 2, 5, '#4b4b55');
            },
        },
        bancoInterno: {
            w: 32, h: 14, base: [1, 4, 30, 8], sombra: [16, 12, 14, 2],
            desenhar(g) {
                g.rect(1, 3, 30, 5, '#3d7be0'); g.row(3, 1, 30, '#6fa0f0'); g.row(7, 1, 30, '#2c5db0');
                g.rect(3, 8, 2, 5, '#5a5f6b'); g.rect(27, 8, 2, 5, '#5a5f6b');
            },
        },
        poste: {
            w: 12, h: 44, base: [3, 39, 6, 4], sombra: [6, 42, 5, 2],
            desenhar(g) {
                g.rect(5, 8, 2, 32, '#3a3f4a'); g.col(6, 8, 39, '#575e6d');
                g.rect(3, 39, 6, 4, '#3a3f4a');
                g.rect(2, 1, 8, 7, '#ffefa8'); g.rect(3, 2, 6, 5, '#fff8d6'); g.row(0, 3, 8, '#3a3f4a'); g.row(8, 2, 9, '#3a3f4a');
            },
        },
        lixeira: {
            w: 12, h: 16, base: [1, 9, 10, 6], sombra: [6, 15, 5, 1],
            desenhar(g, o) {
                const c = o.cor || '#2f9e41';
                g.rect(1, 2, 10, 13, c); g.col(9, 3, 14, Cor.shade(c, -0.25)); g.col(2, 3, 14, Cor.shade(c, 0.2));
                g.row(1, 0, 11, Cor.shade(c, -0.35)); g.row(2, 0, 11, Cor.shade(c, -0.15));
                g.row(7, 1, 10, Cor.shade(c, -0.15));
            },
        },
        fonte: {
            w: 64, h: 50, base: [4, 18, 56, 28], sombra: [32, 44, 30, 5], frames: 3,
            desenhar(g, o) {
                const f = o.frame || 0;
                const cx = 32, cy = 30;
                for (let y = 0; y < 50; y++) for (let x = 0; x < 64; x++) {
                    const dx = (x - cx) / 30, dy = (y - cy) / 16;
                    const d = dx * dx + dy * dy;
                    if (d <= 1) g.set(x, y, d > 0.72 ? (y > cy + 6 ? '#a8a08f' : '#d2cbb9') : '#4aa6e0');
                    if (d > 0.72 && d <= 1 && y > cy + 9) g.set(x, y + 3, '#8d8677');
                }
                for (let y = 20; y < 46; y++) for (let x = 2; x < 62; x++) if (g.get(x, y) === '#4aa6e0') {
                    if (hash(x, y + f * 7, 4) > 0.9) g.set(x, y, '#8fd6f8');
                    if (y < cy - 6) g.set(x, y, '#3b8fcb');
                }
                // anéis de água
                for (let a = 0; a < 40; a++) {
                    const ang = a / 40 * Math.PI * 2, r = 10 + f * 3;
                    g.set(Math.round(cx + Math.cos(ang) * r * 1.6), Math.round(cy + 2 + Math.sin(ang) * r * 0.55), '#b8e8ff');
                }
                // pilar e esguicho
                g.rect(29, 14, 6, 18, '#cfc7b3'); g.col(34, 14, 31, '#a9a18f'); g.col(29, 14, 31, '#e6dfcd');
                g.rect(24, 12, 16, 4, '#d8d0bc'); g.row(15, 24, 39, '#a9a18f');
                const jato = ['#d9f3ff', '#9fdcff'];
                for (let y = 0; y < 12; y++) { g.set(31 + (y + f) % 2, y, jato[(y + f) % 2]); g.set(32, y, '#ffffff'); }
                [[-1, 0], [1, 0]].forEach(([s]) => { for (let i = 0; i < 12; i++) g.set(32 + s * (3 + i), 1 + Math.round(i * i * 0.13) + (i > 6 ? f % 2 : 0), i % 2 ? '#9fdcff' : '#d9f3ff'); });
            },
        },
        predio: {
            w: 224, h: 112, sombra: [112, 110, 110, 3],
            base: [[0, 34, 96, 78], [128, 34, 96, 78], [96, 34, 32, 60]],
            desenhar(g) {
                // telhado
                for (let y = 0; y < 34; y++) {
                    const ins = Math.max(0, 6 - y);
                    for (let x = ins; x < 224 - ins; x++) {
                        let c = (y % 6 < 2) ? '#c4552f' : '#e2703f';
                        if ((x + (Math.floor(y / 6) % 2) * 6) % 12 === 0 && y % 6 >= 2) c = '#b94b29';
                        if (y % 6 === 2 && (x % 12) > 2 && (x % 12) < 9) c = '#f08a55';
                        g.set(x, y, c);
                    }
                }
                g.row(0, 6, 217, '#9d3d22'); g.row(1, 5, 218, '#ad4425');
                g.row(32, 0, 223, '#8a3520'); g.row(33, 0, 223, '#6e2b1a');
                // fachada
                for (let y = 34; y < 112; y++) for (let x = 2; x < 222; x++) g.set(x, y, (y < 38) ? '#d8c69d' : '#f1e3bf');
                for (let x = 2; x < 222; x++) { g.set(x, 100, '#c9b48a'); g.set(x, 101, '#b19c72'); }
                for (let y = 102; y < 112; y++) g.row(y, 2, 221, '#d9cba9');
                g.row(111, 2, 221, '#b8a780');
                // colunas
                [2, 60, 92, 128, 160, 218].forEach(cx => { for (let y = 38; y < 102; y++) { g.row(y, cx, cx + 3, '#fbf3df'); g.set(cx + 3, y, '#d8c69d'); } });
                // janelas
                [[12, 44], [36, 44], [168, 44], [192, 44], [12, 72], [36, 72], [168, 72], [192, 72], [68, 44], [140, 44]].forEach(([x, y]) => janela(g, x, y, 18, 20));
                // pórtico verde com o nome
                for (let y = 38; y < 102; y++) g.row(y, 96, 127, y < 60 ? '#2f9e41' : '#e9dab4');
                g.row(38, 94, 129, '#1f6e2c'); g.row(59, 94, 129, '#1f6e2c'); g.row(60, 94, 129, '#185a24');
                g.col(94, 38, 60, '#1f6e2c'); g.col(129, 38, 60, '#1f6e2c');
                logoIF(g, 100, 42, 2);
                // porta de vidro dupla
                g.rect(98, 66, 28, 34, '#4b5563');
                g.rect(100, 68, 11, 32, '#7cc6ec'); g.rect(113, 68, 11, 32, '#7cc6ec');
                g.rect(100, 68, 4, 8, '#c9ecff'); g.rect(113, 68, 4, 8, '#c9ecff');
                g.col(110, 82, 86, '#e7e7e7'); g.col(114, 82, 86, '#e7e7e7');
                for (let y = 102; y < 112; y++) g.row(y, 94, 129, y % 3 === 0 ? '#b8a780' : '#e2d6ba');
                // floreiras
                [[6, 96], [40, 96], [166, 96], [196, 96]].forEach(([x, y]) => {
                    g.rect(x, y, 22, 6, '#a3643c'); g.row(y, x, x + 21, '#7d4a2b');
                    for (let i = 0; i < 22; i += 2) { g.set(x + i, y - 1, '#4a9a3c'); g.set(x + i + 1, y - 2, ['#ff6b8b', '#ffd84a', '#ffffff'][(i / 2) % 3]); }
                });
            },
        },
        placaIF: {
            w: 48, h: 34, base: [6, 28, 36, 5], sombra: [24, 32, 20, 2],
            desenhar(g) {
                g.rect(8, 24, 3, 9, '#5e3c24'); g.rect(37, 24, 3, 9, '#5e3c24');
                g.rect(1, 1, 46, 24, '#1f6e2c'); g.rect(2, 2, 44, 22, '#2f9e41'); g.row(2, 2, 45, '#4cbf5f');
                logoIF(g, 5, 3, 1);
                const ctx = { fillStyle: '', fillRect(x, y, w, h) { g.rect(x, y, w, h, this.fillStyle); } };
                textoPixel(ctx, 'IFPB', 24, 7, '#ffffff');
                textoPixel(ctx, 'CAMPUS', 20, 15, '#d9f5dd');
            },
        },
        portao: {
            w: 64, h: 26, base: [0, 18, 64, 8],
            desenhar(g) {
                g.rect(0, 2, 4, 24, '#6b7280'); g.rect(60, 2, 4, 24, '#6b7280'); g.row(1, 0, 3, '#9aa3b2'); g.row(1, 60, 63, '#9aa3b2');
                for (let x = 6; x < 60; x += 4) { g.col(x, 6, 25, '#3a3f4a'); g.set(x, 5, '#f2c230'); }
                g.row(8, 4, 59, '#3a3f4a'); g.row(20, 4, 59, '#3a3f4a'); g.col(31, 6, 25, '#2b2f38'); g.col(32, 6, 25, '#2b2f38');
            },
        },
        cesta: {
            w: 26, h: 44, base: [10, 38, 6, 5], sombra: [13, 42, 6, 2],
            desenhar(g) {
                g.rect(12, 14, 3, 28, '#5d636f'); g.col(14, 14, 41, '#3f4450');
                g.rect(1, 1, 24, 15, '#ffffff'); g.rect(3, 3, 20, 11, '#f4f4f4');
                g.row(1, 1, 24, '#d0d4da'); g.rect(8, 6, 10, 6, '#e14b3a'); g.rect(9, 7, 8, 4, '#f4f4f4');
                g.row(16, 7, 19, '#ff6a2a'); g.row(17, 8, 18, '#e85a1f');
                for (let i = 0; i < 5; i++) g.pts([[8 + i * 3, 18], [9 + i * 2, 20], [10 + i * 1.5 | 0, 22]], '#f1f1f1');
            },
        },
        linhasQuadra: {
            camada: 'chao', contorno: false,
            desenhar(g, o) {
                const w = o.w, h = o.h, L = PAL.linha;
                const cy = Math.floor(h / 2);
                g.row(cy, 2, w - 3, L);
                for (let a = 0; a < 60; a++) { const t = a / 60 * Math.PI * 2; g.set(Math.round(w / 2 + Math.cos(t) * 14), Math.round(cy + Math.sin(t) * 14), L); }
                // garrafões
                [[0, 1], [h - 1, -1]].forEach(([y0, s]) => {
                    for (let i = 0; i < 34; i++) { g.set(Math.floor(w / 2) - 16, y0 + s * i, L); g.set(Math.floor(w / 2) + 16, y0 + s * i, L); }
                    g.row(y0 + s * 34, Math.floor(w / 2) - 16, Math.floor(w / 2) + 16, L);
                    for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI; g.set(Math.round(w / 2 + Math.cos(t) * 16), Math.round(y0 + s * 34 + s * Math.sin(t) * 10), L); }
                });
            },
        },
        horta: {
            w: 16, h: 16, base: [3, 9, 10, 5],
            desenhar(g, o) {
                const tipo = o.planta || 0;
                if (tipo === 0) { // alface
                    for (let y = 4; y < 14; y++) for (let x = 2; x < 14; x++) { const dx = (x - 7.5) / 6, dy = (y - 9) / 5; if (dx * dx + dy * dy < 1) g.set(x, y, y < 8 ? '#9fe07a' : '#5cb54a'); }
                    g.pts([[7, 6], [5, 9], [10, 9], [8, 11]], '#3f8f38');
                } else if (tipo === 1) { // cenoura
                    [[4, 0], [8, 1], [12, 0]].forEach(([x, d]) => { g.col(x, 4 + d, 11, '#4fa83e'); g.set(x - 1, 5 + d, '#6cc451'); g.set(x + 1, 6 + d, '#6cc451'); g.rect(x - 1, 12, 3, 2, '#f08a24'); });
                } else { // tomate
                    g.col(8, 2, 13, '#4f8a35'); g.col(6, 4, 12, '#5f9a40'); g.col(10, 4, 12, '#5f9a40');
                    [[5, 6], [10, 8], [7, 10], [11, 4]].forEach(([x, y]) => { g.rect(x, y, 2, 2, '#e8402f'); g.set(x, y, '#ff8a6a'); });
                    g.row(13, 4, 12, '#8a6a4a');
                }
            },
        },
        regador: {
            w: 14, h: 12, base: [1, 6, 12, 5], sombra: [7, 11, 6, 1],
            desenhar(g) { g.rect(3, 4, 7, 7, '#3d7be0'); g.row(4, 3, 9, '#6fa0f0'); g.pts([[10, 6], [11, 5], [12, 4], [13, 3]], '#3d7be0'); g.rect(4, 1, 5, 1, '#2c5db0'); g.pts([[4, 2], [8, 2]], '#2c5db0'); },
        },
        bicicletario: {
            w: 48, h: 20, base: [0, 12, 48, 6],
            desenhar(g) {
                g.row(17, 0, 47, '#6b7280');
                [[2, '#e14b3a'], [26, '#3d7be0']].forEach(([x, c]) => {
                    for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; g.set(Math.round(x + 4 + Math.cos(t) * 4), Math.round(13 + Math.sin(t) * 4), '#2b2b33'); g.set(Math.round(x + 16 + Math.cos(t) * 4), Math.round(13 + Math.sin(t) * 4), '#2b2b33'); }
                    g.pts([[x + 5, 12], [x + 7, 10], [x + 9, 9], [x + 11, 9], [x + 13, 10], [x + 15, 12], [x + 9, 11], [x + 10, 12]], c);
                    g.row(8, x + 7, x + 9, '#2b2b33'); g.row(7, x + 13, x + 15, '#2b2b33');
                });
            },
        },

        // --------- interiores ---------
        carteira: {
            w: 16, h: 22, base: [1, 10, 14, 10], sombra: [8, 21, 7, 1],
            desenhar(g) {
                // cadeira (atrás)
                g.rect(3, 0, 10, 5, '#3d7be0'); g.row(0, 3, 12, '#6fa0f0'); g.col(4, 5, 8, '#5a5f6b'); g.col(11, 5, 8, '#5a5f6b');
                // mesa
                g.rect(1, 8, 14, 7, '#d9a868'); g.row(8, 1, 14, '#ecc48a'); g.row(14, 1, 14, '#a8783f');
                g.rect(2, 15, 2, 6, '#5a5f6b'); g.rect(12, 15, 2, 6, '#5a5f6b');
                g.rect(4, 10, 5, 3, '#ffffff'); g.row(11, 5, 7, '#9ab'); g.set(10, 10, '#e14b3a'); g.col(10, 10, 12, '#e14b3a');
            },
        },
        mesaProf: {
            w: 44, h: 24, base: [1, 6, 42, 14], sombra: [22, 22, 20, 2],
            desenhar(g) {
                g.rect(1, 4, 42, 4, '#a8673a'); g.row(4, 1, 42, '#c88450');
                g.rect(2, 8, 40, 14, '#8a5430'); g.col(41, 8, 21, '#6e4126');
                g.rect(5, 11, 12, 8, '#7a4a2a'); g.rect(27, 11, 12, 8, '#7a4a2a'); g.set(11, 14, '#f2c94c'); g.set(33, 14, '#f2c94c');
                // livros e caneca
                g.rect(5, 0, 8, 4, '#e14b3a'); g.row(0, 5, 12, '#ff7a6a'); g.rect(6, 2, 7, 2, '#3d7be0');
                g.rect(32, 0, 5, 5, '#f4f4f4'); g.set(37, 2, '#f4f4f4'); g.row(0, 32, 36, '#6b4a2b');
                g.rect(18, 1, 9, 3, '#f8f8f8'); g.row(2, 19, 25, '#cfd6de');
            },
        },
        quadro: {
            camada: 'parede', w: 80, h: 26,
            desenhar(g, o) {
                g.rect(0, 0, 80, 24, '#8a5a36'); g.rect(2, 2, 76, 20, '#2f5b45'); g.rect(3, 3, 74, 18, '#356a50');
                for (let i = 0; i < 30; i++) g.set(4 + Math.floor(hash(i, 3, 1) * 72), 4 + Math.floor(hash(i, 5, 1) * 16), '#3f7a5c');
                g.row(23, 4, 76, '#b88a5a'); g.row(24, 2, 78, '#6b4229');
                g.rect(10, 22, 4, 1, '#ffffff'); g.rect(60, 22, 6, 1, '#f6b9d0'); g.rect(40, 22, 3, 1, '#ffef9a');
                const ctx = { fillStyle: '', fillRect(x, y, w, h) { g.rect(x, y, w, h, this.fillStyle); } };
                (o.linhas || []).forEach((t, i) => textoPixel(ctx, t, 40 - Math.floor(larguraTextoPixel(t) / 2), 5 + i * 7, i % 2 ? '#fff4b8' : '#f5f5f5'));
            },
        },
        janela: {
            camada: 'parede', w: 24, h: 22,
            desenhar(g) { janela(g, 1, 1, 22, 20); },
        },
        relogio: {
            camada: 'parede', w: 12, h: 12,
            desenhar(g) {
                for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const d = (x - 5.5) ** 2 + (y - 5.5) ** 2; if (d < 30) g.set(x, y, d > 20 ? '#2b2b33' : '#ffffff'); }
                g.col(6, 3, 6, '#2b2b33'); g.row(6, 6, 8, '#e14b3a');
            },
        },
        placaSala: {
            camada: 'parede', w: 20, h: 9,
            desenhar(g, o) {
                g.rect(0, 0, 20, 9, '#2f9e41'); g.rect(1, 1, 18, 7, '#3cb251');
                const ctx = { fillStyle: '', fillRect(x, y, w, h) { g.rect(x, y, w, h, this.fillStyle); } };
                const t = o.texto || '';
                textoPixel(ctx, t, 10 - Math.floor(larguraTextoPixel(t) / 2), 2, '#ffffff');
            },
        },
        mural: {
            camada: 'parede', w: 40, h: 24,
            desenhar(g) {
                g.rect(0, 0, 40, 24, '#8a5a36'); g.rect(2, 2, 36, 20, '#c9935a');
                for (let i = 0; i < 40; i++) g.set(3 + Math.floor(hash(i, 1, 2) * 34), 3 + Math.floor(hash(i, 2, 2) * 18), '#b47f48');
                [[5, 4, 9, 11, '#ffffff'], [16, 5, 8, 7, '#ffe27a'], [26, 4, 9, 9, '#a8d8ff'], [15, 14, 10, 6, '#ffb3c7'], [27, 15, 8, 5, '#ffffff'], [5, 16, 8, 4, '#c6f1b5']].forEach(([x, y, w, h, c]) => {
                    g.rect(x, y, w, h, c); g.set(x + Math.floor(w / 2), y, '#e14b3a');
                    for (let j = y + 2; j < y + h - 1; j += 2) g.row(j, x + 1, x + w - 2, Cor.shade(c, -0.25));
                });
            },
        },
        cartaz: {
            camada: 'parede', w: 20, h: 26,
            desenhar(g, o) {
                const c = o.cor || '#3d7be0';
                g.rect(0, 0, 20, 26, '#f4f1ea'); g.rect(1, 1, 18, 24, c); g.rect(2, 2, 16, 3, Cor.shade(c, 0.35));
                const ctx = { fillStyle: '', fillRect(x, y, w, h) { g.rect(x, y, w, h, this.fillStyle); } };
                (o.linhas || []).forEach((t, i) => textoPixel(ctx, t, 10 - Math.floor(larguraTextoPixel(t) / 2), 7 + i * 6, '#ffffff'));
                if (o.desenho === 'uk') { g.rect(2, 7, 16, 10, '#1f3a8a'); g.row(11, 2, 17, '#ffffff'); g.row(12, 2, 17, '#ffffff'); g.col(9, 7, 16, '#ffffff'); g.col(10, 7, 16, '#ffffff'); g.row(11, 2, 17, '#d23f3f'); g.col(9, 7, 16, '#d23f3f'); for (let i = 0; i < 10; i++) { g.set(2 + Math.round(i * 1.6), 7 + i, '#d23f3f'); g.set(17 - Math.round(i * 1.6), 7 + i, '#d23f3f'); } }
                if (o.desenho === 'atomo') { for (let a = 0; a < 30; a++) { const t = a / 30 * Math.PI * 2; g.set(Math.round(10 + Math.cos(t) * 7), Math.round(13 + Math.sin(t) * 3), '#ffffff'); g.set(Math.round(10 + Math.cos(t) * 3), Math.round(13 + Math.sin(t) * 7), '#ffffff'); } g.rect(9, 12, 2, 2, '#ffe27a'); }
                if (o.desenho === 'arte') { g.rect(3, 7, 14, 12, '#ffffff'); g.rect(4, 13, 6, 5, '#e14b3a'); g.rect(9, 9, 7, 6, '#3d7be0'); g.rect(6, 8, 4, 4, '#f2c230'); }
                if (o.desenho === 'livro') { g.rect(4, 8, 12, 10, '#ffffff'); g.col(10, 8, 17, '#9aa'); for (let j = 10; j < 17; j += 2) { g.row(j, 5, 8, '#9aa'); g.row(j, 12, 14, '#9aa'); } }
            },
        },
        mapaMundi: {
            camada: 'parede', w: 52, h: 28,
            desenhar(g) {
                g.rect(0, 0, 52, 28, '#8a5a36'); g.rect(2, 2, 48, 24, '#7cc6ec');
                const terras = [[6, 6, 10, 6], [9, 12, 6, 8], [20, 5, 8, 5], [21, 11, 7, 9], [30, 5, 14, 8], [38, 16, 7, 5], [16, 4, 3, 2]];
                terras.forEach(([x, y, w, h]) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (hash(x + i, y + j, 8) > 0.15 || (i > 0 && j > 0 && i < w - 1 && j < h - 1)) g.set(x + i, y + j, j < h / 2 ? '#7ac25b' : '#c9b25a'); });
                g.set(12, 15, '#e14b3a'); g.set(13, 15, '#e14b3a');
            },
        },
        estante: {
            w: 30, h: 38, base: [0, 28, 30, 8], sombra: [15, 36, 14, 2],
            desenhar(g) {
                g.rect(0, 0, 30, 36, '#7a4a2a'); g.rect(2, 2, 26, 32, '#5b3520');
                const cores = ['#e14b3a', '#3d7be0', '#2f9e41', '#f2c230', '#8a5cd6', '#f08a24', '#e6e6e6'];
                [2, 13, 24].forEach((y, r) => {
                    let x = 3;
                    while (x < 26) {
                        const w = 2 + Math.floor(hash(x, y, r) * 2), h = 7 + Math.floor(hash(y, x, r) * 3);
                        const c = cores[Math.floor(hash(x, r, y) * cores.length)];
                        g.rect(x, y + 10 - h, w, h, c); g.col(x, y + 10 - h, y + 9, Cor.shade(c, 0.25));
                        x += w + (hash(x, y, 7) > 0.8 ? 2 : 0);
                    }
                    g.row(y + 10, 1, 28, '#9a6538');
                });
            },
        },
        armario: {
            w: 16, h: 34, base: [0, 24, 16, 8], sombra: [8, 32, 8, 2],
            desenhar(g, o) {
                const c = o.cor || '#4f86c9';
                g.rect(0, 0, 16, 32, c); g.col(15, 0, 31, Cor.shade(c, -0.3)); g.col(0, 0, 31, Cor.shade(c, 0.2));
                g.col(7, 1, 31, Cor.shade(c, -0.35));
                [2, 9].forEach(x => { for (let y = 3; y < 9; y += 2) g.row(y, x + 1, x + 4, Cor.shade(c, -0.25)); g.rect(x + 4, 15, 1, 3, '#e6e6e6'); });
                g.row(32, 0, 15, '#3a3f4a'); g.row(33, 1, 14, '#2b2f38');
            },
        },
        vaso: {
            w: 16, h: 24, base: [3, 16, 10, 6], sombra: [8, 22, 6, 1],
            desenhar(g) {
                g.rect(4, 15, 8, 8, '#c9693f'); g.row(15, 3, 12, '#a85430'); g.col(11, 16, 22, '#9a4c2b');
                const F = ['#3f9a3c', '#62b84a', '#2f7a30'];
                [[8, 2], [4, 5], [12, 5], [6, 9], [10, 9], [8, 7], [3, 10], [13, 10]].forEach(([x, y], i) => { g.rect(x - 1, y, 3, 4, F[i % 3]); g.set(x, y - 1, F[1]); });
                g.col(8, 6, 14, '#2f7a30');
            },
        },
        bebedouro: {
            w: 16, h: 26, base: [1, 16, 14, 8], sombra: [8, 24, 7, 1],
            desenhar(g) {
                g.rect(2, 8, 12, 16, '#c9d2dc'); g.col(13, 8, 23, '#9aa6b4'); g.rect(1, 6, 14, 3, '#e6ecf2');
                g.rect(5, 7, 6, 1, '#9aa6b4'); g.set(8, 5, '#9aa6b4'); g.pts([[8, 3], [9, 4]], '#9fdcff');
                g.rect(5, 12, 6, 3, '#3d7be0'); g.row(24, 2, 13, '#5a5f6b');
            },
        },
        trofeus: {
            w: 32, h: 38, base: [0, 28, 32, 8], sombra: [16, 36, 15, 2],
            desenhar(g) {
                g.rect(0, 0, 32, 36, '#6e4126'); g.rect(2, 2, 28, 31, '#bfe6f7');
                g.row(17, 2, 29, '#8a5430'); g.row(33, 0, 31, '#5b3520');
                [[5, 6], [14, 4], [23, 7]].forEach(([x, y]) => { g.rect(x, y, 5, 4, '#f2c230'); g.rect(x + 1, y + 4, 3, 2, '#d9a830'); g.rect(x, y + 6, 5, 2, '#8a5430'); g.set(x + 1, y, '#fff3a8'); g.set(x - 1, y + 1, '#f2c230'); g.set(x + 5, y + 1, '#f2c230'); });
                [[5, 22, '#cfd6de'], [14, 21, '#f2c230'], [23, 22, '#d48a4a']].forEach(([x, y, c]) => { for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; g.set(Math.round(x + 2 + Math.cos(t) * 3), Math.round(y + 4 + Math.sin(t) * 3), c); } g.rect(x + 1, y + 3, 3, 3, c); g.col(x + 2, y - 2, y, '#e14b3a'); });
                for (let y = 3; y < 32; y += 6) g.set(3, y, '#ffffff');
            },
        },
        cavalete: {
            w: 22, h: 32, base: [3, 26, 16, 5], sombra: [11, 30, 8, 2],
            desenhar(g, o) {
                g.pts([[5, 31], [6, 28], [7, 24], [16, 31], [15, 28], [14, 24]], '#8a5a36');
                g.col(10, 2, 31, '#7a4a2a'); g.col(11, 2, 31, '#8a5a36');
                g.rect(2, 4, 18, 16, '#ffffff'); g.row(20, 1, 20, '#7a4a2a');
                const v = o.variante || 0;
                if (v === 0) { g.rect(3, 5, 16, 7, '#8fd3ff'); g.rect(3, 12, 16, 7, '#7ac25b'); for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; g.set(Math.round(15 + Math.cos(t) * 2), Math.round(8 + Math.sin(t) * 2), '#ffd84a'); } g.rect(14, 7, 3, 3, '#ffd84a'); g.rect(5, 10, 4, 4, '#3f9a3c'); }
                else { g.rect(4, 6, 6, 6, '#e14b3a'); g.rect(11, 9, 7, 8, '#3d7be0'); g.rect(6, 13, 4, 5, '#f2c230'); g.row(12, 3, 18, '#2b2b33'); g.col(10, 5, 18, '#2b2b33'); }
            },
        },
        mesaLivros: {
            w: 28, h: 20, base: [1, 6, 26, 10], sombra: [14, 18, 12, 2],
            desenhar(g) {
                g.rect(1, 6, 26, 5, '#a8673a'); g.row(6, 1, 26, '#c88450'); g.rect(3, 11, 2, 8, '#6e4126'); g.rect(23, 11, 2, 8, '#6e4126');
                g.rect(4, 2, 8, 4, '#8a5cd6'); g.rect(5, 0, 7, 2, '#f2c230'); g.rect(15, 3, 9, 3, '#ffffff'); g.col(19, 3, 5, '#9aa');
            },
        },
        globo: {
            w: 16, h: 22, base: [3, 16, 10, 5], sombra: [8, 21, 5, 1],
            desenhar(g) {
                for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) { const d = (x - 7.5) ** 2 + (y - 6) ** 2; if (d < 30) g.set(x, y, hash(x, y, 3) > 0.55 ? '#7ac25b' : '#4aa6e0'); }
                g.pts([[5, 3], [6, 3], [5, 4]], '#cfeeff');
                g.col(8, 13, 17, '#c9a24a'); g.rect(4, 18, 9, 3, '#8a5430');
            },
        },
        emblema: {
            camada: 'chao', w: 48, h: 48, contorno: false,
            desenhar(g) {
                for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const d = (x - 23.5) ** 2 + (y - 23.5) ** 2; if (d < 23 * 23) g.set(x, y, d > 20 * 20 ? '#e6b24c' : '#2f9e41'); }
                logoIF(g, 10, 4, 2);
            },
        },
    },

    // Cria o objeto pronto para o mundo (imagens já desenhadas)
    criar(def) {
        const tipo = this.tipos[def.tipo];
        if (!tipo) { console.warn('Objeto desconhecido:', def.tipo); return null; }
        const w = def.w || tipo.w, h = def.h || tipo.h;
        const opts = Object.assign({}, def, { w, h });
        const imgs = [];
        const nFrames = tipo.frames || 1;
        for (let f = 0; f < nFrames; f++) imgs.push(obj(w, h, (g, o) => tipo.desenhar(g, Object.assign(o, { frame: f })), Object.assign({}, opts, { contorno: tipo.contorno })));
        const x = def.x * TILE + (def.dx || 0), y = def.y * TILE + (def.dy || 0);
        let bases = tipo.base ? (Array.isArray(tipo.base[0]) ? tipo.base : [tipo.base]) : [];
        bases = bases.map(([bx, by, bw, bh]) => ({ x: x + bx, y: y + by, w: bw, h: bh }));
        return {
            tipo: def.tipo, x, y, w, h, imgs, camada: def.camada || tipo.camada || 'y',
            bases, info: def.info || null,
            sombra: tipo.sombra ? { x: x + tipo.sombra[0], y: y + tipo.sombra[1], rx: tipo.sombra[2], ry: tipo.sombra[3] } : null,
            ordem: bases.length ? Math.max(...bases.map(b => b.y + b.h)) : y + h,
        };
    },
};

function janela(g, x, y, w, h) {
    g.rect(x, y, w, h, '#f7f7f2');
    g.rect(x + 2, y + 2, w - 4, h - 4, '#7cc6ec');
    g.rect(x + 2, y + 2, Math.floor((w - 4) / 2), 4, '#bfe8ff');
    g.col(x + Math.floor(w / 2), y + 2, y + h - 3, '#f7f7f2');
    g.row(y + Math.floor(h / 2), x + 2, x + w - 3, '#f7f7f2');
    g.row(y + h, x - 1, x + w, '#cbbd9a');
}

// Logo dos Institutos Federais (círculo vermelho + quadrados verdes)
function logoIF(g, x, y, s) {
    const q = (cx, cy, cor) => g.rect(x + cx * (s * 5), y + cy * (s * 5), s * 4, s * 4, cor);
    for (let a = 0; a < s * 4; a++) for (let b = 0; b < s * 4; b++) { const d = (a - s * 2 + 0.5) ** 2 + (b - s * 2 + 0.5) ** 2; if (d <= (s * 2) ** 2) g.set(x + a, y + b, '#e0332b'); }
    const verde = '#9fe0a8';
    [[1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [2, 2], [0, 3], [1, 3]].forEach(([cx, cy]) => q(cx, cy, cy === 0 || cx === 2 ? '#ffffff' : verde));
}
