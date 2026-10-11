// =========================================================================
// BANCO DE PERGUNTAS
// Cada arquivo em data/perguntas/ chama PERGUNTAS.add('materia', [...])
// Formato de cada pergunta:
//   [dificuldade (1, 2 ou 3), 'pergunta', 'resposta certa', 'errada 1', 'errada 2', 'errada 3', 'explicação']
// As alternativas são embaralhadas na hora, então a certa pode ficar sempre em primeiro no arquivo.
// =========================================================================

const PERGUNTAS = {
    banco: {},

    add(materia, lista) {
        const b = this.banco[materia] = this.banco[materia] || [];
        lista.forEach((q, i) => {
            if (!Array.isArray(q) || q.length < 6) { console.warn('Pergunta mal formatada em', materia, i, q); return; }
            b.push({
                id: `${materia}:${b.length}`, materia, dif: Math.min(3, Math.max(1, +q[0] || 1)),
                texto: q[1], certa: q[2], erradas: q.slice(3, 6).filter(Boolean), exp: q[6] || '',
            });
        });
    },

    // perguntas importadas pelo painel (ficam salvas no totem)
    carregarExtras() {
        Dados.perguntasExtras().forEach(q => {
            const b = this.banco[q.materia] = this.banco[q.materia] || [];
            b.push({ ...q, id: `${q.materia}:x${q.uid}` });
        });
    },

    contagem() {
        const out = {};
        Object.keys(MATERIAS).forEach(m => {
            const l = this.banco[m] || [];
            out[m] = { total: l.length, 1: 0, 2: 0, 3: 0 };
            l.forEach(q => out[m][q.dif]++);
        });
        return out;
    },

    // Sorteia uma pergunta que o jogador ainda não respondeu
    sortear(materias, dif, jogador) {
        const materia = materias[Math.floor(Math.random() * materias.length)];
        const todas = this.banco[materia] || [];
        if (!todas.length) return null;
        const feitas = new Set(jogador.respondidas[materia] || []);
        let pool = todas.filter(q => q.dif === dif && !feitas.has(q.id));
        if (!pool.length) {
            // já respondeu todas desse nível: libera de novo
            const ids = todas.filter(q => q.dif === dif).map(q => q.id);
            jogador.respondidas[materia] = (jogador.respondidas[materia] || []).filter(id => !ids.includes(id));
            pool = todas.filter(q => q.dif === dif);
        }
        if (!pool.length) pool = todas.filter(q => !feitas.has(q.id));
        if (!pool.length) pool = todas;
        const q = pool[Math.floor(Math.random() * pool.length)];
        const opcoes = embaralhar([q.certa, ...q.erradas]);
        return { ...q, opcoes, correta: opcoes.indexOf(q.certa) };
    },

    // Lê um CSV (separado por ; ou ,) no formato do modelo-perguntas.csv
    lerCSV(texto) {
        const linhas = parseCSV(texto);
        if (!linhas.length) return { ok: [], erros: ['Arquivo vazio'] };
        const cab = linhas[0].map(c => normalizar(c));
        const idx = nome => cab.findIndex(c => c.startsWith(nome));
        const col = {
            materia: idx('materia'), dif: idx('dificuldade'), texto: idx('pergunta'), certa: idx('correta'),
            e1: idx('errada1'), e2: idx('errada2'), e3: idx('errada3'), exp: idx('explicacao'),
        };
        const temCab = col.materia >= 0 && col.texto >= 0;
        const ordem = temCab ? col : { materia: 0, dif: 1, texto: 2, certa: 3, e1: 4, e2: 5, e3: 6, exp: 7 };
        const ok = [], erros = [];
        const mapaMat = {};
        Object.entries(MATERIAS).forEach(([id, m]) => { mapaMat[normalizar(id)] = id; mapaMat[normalizar(m.nome)] = id; });
        linhas.slice(temCab ? 1 : 0).forEach((l, i) => {
            if (!l.some(c => c.trim())) return;
            const n = i + (temCab ? 2 : 1);
            const materia = mapaMat[normalizar(l[ordem.materia] || '')];
            const dif = +(l[ordem.dif] || '').replace(/\D/g, '') || ({ facil: 1, medio: 2, dificil: 3 })[normalizar(l[ordem.dif] || '')];
            const q = {
                materia, dif, texto: (l[ordem.texto] || '').trim(), certa: (l[ordem.certa] || '').trim(),
                erradas: [l[ordem.e1], l[ordem.e2], l[ordem.e3]].map(x => (x || '').trim()).filter(Boolean),
                exp: (l[ordem.exp] || '').trim(),
            };
            if (!materia) return erros.push(`Linha ${n}: matéria "${l[ordem.materia]}" não existe`);
            if (![1, 2, 3].includes(dif)) return erros.push(`Linha ${n}: dificuldade deve ser 1, 2 ou 3`);
            if (!q.texto || !q.certa || q.erradas.length < 1) return erros.push(`Linha ${n}: faltam pergunta, resposta certa ou erradas`);
            q.uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
            ok.push(q);
        });
        return { ok, erros };
    },
};

function embaralhar(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

function normalizar(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function parseCSV(texto) {
    texto = texto.replace(/^﻿/, '');
    const primeira = texto.split(/\r?\n/)[0] || '';
    const sep = (primeira.split(';').length >= primeira.split(',').length) ? ';' : ',';
    const linhas = []; let campo = '', linha = [], aspas = false;
    for (let i = 0; i < texto.length; i++) {
        const c = texto[i];
        if (aspas) {
            if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
            else if (c === '"') aspas = false;
            else campo += c;
        } else if (c === '"') aspas = true;
        else if (c === sep) { linha.push(campo); campo = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && texto[i + 1] === '\n') i++;
            linha.push(campo); linhas.push(linha); linha = []; campo = '';
        } else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    return linhas;
}
