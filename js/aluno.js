// =========================================================================
// ALUNO DO IFPB — jogador e colegas
// Farda do IF (camisa verde ou branca com a logo e frisos), calça escura,
// tênis de sola branca e uma MOCHILA grande que muda a silhueta.
// Usa Grid / Cor / paleta e as funções de cabelo e rosto de js/sprites.js.
// =========================================================================

const Aluno = (() => {
    // cores de mochila (sem verde, para não sumir na farda)
    const MOCHILAS = ['#e04a3f', '#3d6fd9', '#f08c25', '#8b57d8', '#f0c02e', '#18a3a6', '#e2578e', '#2f4f99'];

    function hash(s) {
        let h = 2166136261;
        for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
        h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
        return h >>> 0;
    }
    function luz(hex) { const [r, g, b] = Cor.rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

    function pal(L) {
        const P = paleta(L);
        const cr = L.corRoupa || '#2f9e41';
        const branca = luz(cr) > 0.8;
        P.branca = branca;
        P.cam = branca ? '#e9eeeb' : cr;
        P.camL = branca ? '#ffffff' : Cor.shade(cr, 0.2);
        P.camS = branca ? '#b4c1c9' : Cor.shade(cr, -0.3);
        P.friso = branca ? '#2f9e41' : '#ffffff';
        P.logo = branca ? '#2f9e41' : '#ffffff';
        P.logoR = '#e5322b';
        const c = L.corCalca || '#2f3a5a';
        P.cal = c; P.calL = Cor.shade(c, 0.22); P.calS = Cor.shade(c, -0.32);
        const m = L.corMochila || MOCHILAS[hash('mochila12228' + (L.pele || '') + (L.cabelo || '') + (L.corCabelo || '')) % MOCHILAS.length];
        P.moc = m; P.mocL = Cor.shade(m, 0.3); P.mocS = Cor.shade(m, -0.3); P.mocD = Cor.shade(m, -0.55);
        P.alca = luz(m) > 0.6 ? P.mocS : m;
        P.metal = '#e8edf2';
        P.ten = L.corTenis || '#2d3142'; P.sola = '#f3f1ea';
        return P;
    }

    // ------------------------------------------------------------- pernas
    function pernasFrente(g, P, f, esporte) {
        const lift = [f === 1 ? 1 : 0, f === 2 ? 1 : 0];
        g.row(18, 5, 10, esporte ? P.cal : P.calS);
        [[0, 5], [1, 8]].forEach(([i, x0]) => {
            const fim = 21 - lift[i];
            const fora = i === 0 ? x0 : x0 + 2, dentro = i === 0 ? x0 + 2 : x0;
            for (let y = 19; y <= fim; y++) {
                if (esporte && y >= 20) { g.row(y, x0, x0 + 2, P.pele); g.set(x0 + 2, y, P.peleS); continue; }
                g.row(y, x0, x0 + 2, P.cal);
                g.set(fora, y, i === 0 ? P.calL : P.calS);
                if (y >= 20) g.set(dentro, y, P.calS);            // vão entre as pernas
            }
            // tênis: um pouco mais largo, com a ponta para fora
            const t0 = i === 0 ? x0 - 1 : x0 + 1;
            g.row(fim + 1, t0, t0 + 2, P.ten);
            g.row(fim + 2, t0, t0 + 2, P.sola);
        });
    }

    function pernasLado(g, P, f, esporte) {
        const corP = (y, perto) => {
            if (esporte && y >= 20) return perto ? P.pele : P.peleS;
            return perto ? P.cal : P.calS;
        };
        g.row(18, 6, 9, esporte ? P.cal : P.calS);
        if (f === 0) {
            for (let y = 19; y <= 21; y++) { g.row(y, 6, 9, corP(y, true)); g.set(6, y, corP(y, false)); }
            g.row(22, 6, 10, P.ten); g.row(23, 6, 10, P.sola);
            return;
        }
        // perna de trás e da frente (f1: perna de perto vai na frente; f2: a de longe)
        const tras = [[19, 6, 7], [20, 5, 6], [21, 4, 5]];
        const frente = [[19, 8, 9], [20, 9, 10], [21, 10, 11]];
        const pertoNaFrente = f === 1;
        const desenha = (seg, perto, pe) => {
            seg.forEach(([y, a, b]) => g.row(y, a, b, corP(y, perto)));
            g.row(22, pe[0], pe[1], perto ? P.ten : Cor.shade(P.ten, -0.25));
            g.row(23, pe[0], pe[1], perto ? P.sola : Cor.shade(P.sola, -0.18));
        };
        // longe primeiro
        if (pertoNaFrente) { desenha(tras, false, [3, 5]); desenha(frente, true, [10, 12]); }
        else { desenha(frente, false, [10, 12]); desenha(tras, true, [3, 5]); }
    }

    // ------------------------------------------------------------- tronco
    function troncoFrente(g, P, view, esporte) {
        for (let y = 12; y <= 17; y++) g.row(y, 4, 11, P.cam);
        g.col(4, 12, 16, P.camL);
        g.col(11, 12, 17, P.camS);
        g.row(17, 4, 11, P.camS);
        if (esporte) g.row(14, 4, 11, P.friso);
        if (view === 'down') {
            // gola polo
            g.pts([[6, 12], [9, 12]], P.friso);
            g.pts([[7, 12], [8, 12]], P.peleS);
            // alças da mochila
            [5, 10].forEach(x => { g.set(x, 12, P.mocL); g.col(x, 13, 16, P.alca); });
            // logo do IF no peito esquerdo
            g.set(8, 14, P.logoR); g.pts([[9, 14], [8, 15], [9, 15]], P.logo);
        }
    }

    function troncoLado(g, P, esporte) {
        for (let y = 12; y <= 17; y++) g.row(y, 5, 10, P.cam);
        g.row(12, 5, 9, P.camL);
        g.col(10, 13, 17, P.camS);
        g.row(17, 5, 10, P.camS);
        if (esporte) g.row(14, 5, 10, P.friso);
        g.set(10, 12, P.friso); g.set(9, 12, P.peleS); // gola
        // alça passando pelo ombro
        g.pts([[6, 12], [7, 12], [8, 12]], P.alca); g.set(7, 12, P.moc === P.alca ? P.mocL : P.moc);
        g.col(9, 13, 16, P.alca);
    }

    // ------------------------------------------------------------- braços
    function bracosFrente(g, P, f, xs) {
        const sw = f === 1 ? [-1, 1] : f === 2 ? [1, -1] : [0, 0];
        xs.forEach((x, i) => {
            const t = 13 + sw[i];
            g.set(x, t, i === 0 ? P.camL : P.cam);
            g.set(x, t + 1, i === 0 ? P.cam : P.camS);
            g.set(x, t + 2, P.pele);
            g.set(x, t + 3, P.peleS);
        });
    }

    function bracoLado(g, P, f) {
        // braço de perto: f0 parado, f1 para trás (perna de perto na frente), f2 para frente
        // cada linha: [y, x, cor da esquerda, cor da direita]
        const A = {
            0: [[13, 7, 'L', 'm'], [14, 7, 'm', 'S'], [15, 7, 'p', 'p'], [16, 7, 's', 's']],
            1: [[13, 6, 'L', 'm'], [14, 5, 'm', 'S'], [15, 4, 'p', 'p'], [16, 4, 's', '']],
            2: [[13, 7, 'L', 'm'], [14, 8, 'm', 'S'], [15, 9, 'p', 'p'], [16, 10, 's', '']],
        }[f];
        const cor = { L: P.camL, m: P.cam, S: P.camS, p: P.pele, s: P.peleS };
        if (f === 0) g.col(6, 13, 15, P.camS); // sombra do braço no tronco
        A.forEach(([y, x, a, b]) => { g.set(x, y, cor[a]); if (b) g.set(x + 1, y, cor[b]); });
    }

    // ------------------------------------------------------------- mochila
    function mochilaCostas(g, P, dy) {
        const y0 = 12 + dy, y1 = y0 + 7;
        for (let y = y0; y <= y1; y++) {
            const a = (y === y0 || y === y1) ? 4 : 3, b = (y === y0 || y === y1) ? 11 : 12;
            g.row(y, a, b, P.moc);
        }
        g.row(y0, 4, 11, P.mocL);
        g.col(3, y0 + 1, y1 - 1, P.mocL);
        g.col(12, y0 + 1, y1 - 1, P.mocS);
        g.row(y1, 4, 11, P.mocS);
        // tampa
        g.row(y0 + 2, 4, 11, P.mocS);
        // bolso da frente
        g.rect(5, y0 + 3, 6, 4, P.moc);
        g.row(y0 + 3, 5, 10, P.mocD);
        g.set(9, y0 + 4, P.metal);
        g.col(10, y0 + 4, y0 + 6, P.mocS); g.row(y0 + 6, 5, 10, P.mocS);
        // alças subindo para os ombros
        g.pts([[5, y0 - 1], [10, y0 - 1]], P.alca);
    }

    // de frente: as laterais da mochila aparecem atrás dos braços
    function mochilaLados(g, P, dy) {
        const y0 = 13 + dy, y1 = y0 + 5;
        g.col(2, y0, y1, P.mocS); g.col(13, y0, y1, P.mocD);
        g.set(2, y0, P.moc); g.set(13, y0, P.mocS);
    }

    function mochilaLado(g, P, dy) {
        const y0 = 11 + dy, y1 = y0 + 8;
        for (let y = y0; y <= y1; y++) {
            const borda = y === y0 || y === y1;
            g.row(y, borda ? 2 : 1, borda ? 4 : 5, P.moc);
        }
        g.rect(0, y0 + 4, 1, 4, P.moc); // bolso
        g.row(y0, 2, 4, P.mocL); g.row(y0 + 1, 1, 4, P.mocL);
        g.col(5, y0 + 1, y1 - 1, P.mocS);
        g.row(y1, 2, 4, P.mocS);
        g.col(0, y0 + 4, y0 + 7, P.mocS);
        g.col(2, y0 + 3, y1 - 1, P.mocD); // zíper
        g.set(2, y0 + 3, P.metal);
    }

    // ------------------------------------------------------------- cabeça
    function cabeca(g, L, P, view) {
        const acc = L.acessorios || [];
        if (view === 'right') {
            g.rect(4, 3, 9, 9, P.pele);
            g.pts([[4, 3], [12, 3], [4, 11], [12, 11]], null);
            g.row(11, 6, 11, P.peleS);
            g.set(13, 8, P.pele);
            g.pts([[10, 7], [10, 8]], P.olho);
            g.set(7, 8, P.peleS);
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
        if (acc.includes('tiara')) {
            const t = L.corTiara || '#e05a7a';
            if (view === 'right') g.row(3, 6, 11, t); else g.row(3, 4, 11, t);
        }
        if (acc.includes('boina')) desenharBoinaMapa(g, P, view);
        if (acc.includes('bone')) desenharBoneMapa(g, P, view);
    }

    function mapa(g, L, view, f) {
        const P = pal(L);
        const esporte = L.roupa === 'esporte';
        const pk = f === 0 ? 0 : 1; // mochila atrasa 1px em relação ao pulo do corpo
        if (view === 'down') {
            pernasFrente(g, P, f, esporte);
            troncoFrente(g, P, 'down', esporte);
            bracosFrente(g, P, f, [3, 12]);
            cabeca(g, L, P, 'down');
            mochilaLados(g, P, pk);
        } else if (view === 'up') {
            pernasFrente(g, P, f, esporte);
            troncoFrente(g, P, 'up', esporte);
            bracosFrente(g, P, f, [2, 13]);
            cabeca(g, L, P, 'up');
            mochilaCostas(g, P, pk);
            // cabelo comprido / rabo caem POR CIMA da mochila, afinando para baixo,
            // para a mochila continuar aparecendo dos lados
            const cab = new Grid(16, 24);
            cabeca(cab, L, P, 'up');
            for (let y = 11; y < 24; y++) {
                const k = y - 11;
                for (let x = 3 + k; x <= 12 - k; x++) { const c = cab.get(x, y); if (c && c !== P.pele && c !== P.peleS) g.set(x, y, c); }
            }
        } else {
            if (f === 1) g.pts([[11, 15], [11, 16]], P.peleS); // mão de longe aparecendo
            pernasLado(g, P, f, esporte);
            troncoLado(g, P, esporte);
            mochilaLado(g, P, pk);
            bracoLado(g, P, f);
            cabeca(g, L, P, 'right');
        }
    }

    // ------------------------------------------------------------- retrato 32x32
    function retrato(g, L) {
        const P = pal(L);
        const esporte = L.roupa === 'esporte';
        // rosto, cabelo, óculos, boné... vêm do gerador dos professores
        const accCabeca = (L.acessorios || []).filter(a => ['bone', 'tiara', 'brincos', 'boina'].includes(a));
        desenharRetrato(g, Object.assign({}, L, { roupa: 'camisa', acessorios: accCabeca }));

        // 1) topo da mochila aparecendo atrás dos ombros (só onde está vazio).
        //    Fica num tom mais escuro que as alças: está atrás, na sombra do corpo.
        const atras = (x, y, c) => { if (!g.get(x, y)) g.set(x, y, c); };
        for (let y = 20; y <= 25; y++) for (let x = 3; x <= 28; x++) {
            if (y === 20 && (x === 3 || x === 28)) continue;    // cantos arredondados
            let c = y === 20 ? P.moc : P.mocS;
            if (x === 3 && y > 20) c = P.moc;
            if (x === 28 && y > 20) c = P.mocD;
            atras(x, y, c);
        }

        // 2) camisa da farda (mesmo formato do busto original)
        const lim = y => y === 24 ? [8, 23] : y === 25 ? [6, 25] : [4, 27];
        for (let y = 24; y <= 31; y++) {
            const [a, b] = lim(y);
            for (let x = a; x <= b; x++) if (!(y === 24 && x >= 13 && x <= 18)) g.set(x, y, P.cam);
        }
        g.row(25, 6, 11, P.camL); g.row(26, 4, 9, P.camL); g.col(4, 27, 31, P.camL); g.col(5, 27, 29, P.camL);
        g.row(25, 22, 25, P.camS); g.col(26, 26, 31, P.camS); g.col(27, 26, 31, P.camS); g.row(24, 21, 23, P.camS);

        if (esporte) {
            g.row(25, 12, 19, P.friso); g.pts([[12, 24], [19, 24]], P.friso);
            g.row(25, 14, 17, P.peleS);
            g.row(29, 4, 27, P.friso);
        } else {
            // gola polo com friso
            g.row(24, 10, 12, P.friso); g.row(24, 19, 21, P.friso);
            g.row(25, 12, 14, P.friso); g.row(25, 17, 19, P.friso);
            g.pts([[14, 26], [17, 26]], P.friso);
            g.row(25, 15, 16, P.peleS); g.row(26, 15, 16, P.peleS);
            g.col(15, 27, 28, P.camS); g.set(16, 27, P.camS);
        }

        // 3) alças da mochila por cima dos ombros
        [[7, 9], [22, 24]].forEach(([a, b]) => {
            for (let y = 23; y <= 31; y++) {
                const cs = [P.mocL, P.moc, P.mocS];
                for (let x = a; x <= b; x++) {
                    const fora = !g.get(x, y) || y >= 24 || [P.moc, P.mocL, P.mocS, P.mocD, P.metal].includes(g.get(x, y));
                    if (fora) g.set(x, y, cs[x - a]);
                }
            }
            g.row(29, a, b, P.metal); g.set(b, 29, '#aeb8c4');
            g.row(30, a, b, P.mocD);
        });

        // 4) logo do IF no peito esquerdo (bolinha vermelha + quadradinhos)
        const Q = P.logo;
        g.set(18, 27, P.logoR); g.pts([[19, 27], [20, 27], [18, 28], [19, 28], [18, 29], [19, 29], [20, 29], [18, 30], [19, 30]], Q);

    }

    return { pal, mapa, retrato, MOCHILAS };
})();
