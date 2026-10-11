// =========================================================================
// SONS (sintetizados na hora, estilo 8-bit, sem precisar de arquivos)
// =========================================================================

const Som = {
    ctx: null, ultimoPasso: 0,

    iniciar() {
        if (this.ctx || !CONFIG.som) return;
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
    },

    nota(freq, inicio, dur, tipo = 'square', vol = 0.06, deslize = 0) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + inicio;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = tipo; o.frequency.setValueAtTime(freq, t);
        if (deslize) o.frequency.linearRampToValueAtTime(freq + deslize, t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this.ctx.destination);
        o.start(t); o.stop(t + dur + 0.02);
    },

    ruido(inicio, dur, vol = 0.03, freq = 1200) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + inicio;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        f.type = 'bandpass'; f.frequency.value = freq;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.buffer = buf; s.connect(f).connect(g).connect(this.ctx.destination); s.start(t);
    },

    blip()     { this.nota(880, 0, 0.03, 'square', 0.025); },
    mover()    { this.nota(660, 0, 0.05, 'square', 0.04); },
    ok()       { this.nota(784, 0, 0.06); this.nota(1175, 0.06, 0.1); },
    voltar()   { this.nota(520, 0, 0.06); this.nota(390, 0.06, 0.08); },
    erroTecla(){ this.nota(180, 0, 0.12, 'sawtooth', 0.04); },
    porta()    { this.ruido(0, 0.25, 0.05, 700); this.nota(300, 0, 0.2, 'triangle', 0.05, -120); },
    passo() {
        if (!this.ctx || this.ctx.currentTime - this.ultimoPasso < 0.2) return;
        this.ultimoPasso = this.ctx.currentTime;
        this.ruido(0, 0.04, 0.012, 2200);
    },
    tique()    { this.nota(1400, 0, 0.03, 'square', 0.03); },
    acerto() {
        [523, 659, 784, 1047].forEach((f, i) => this.nota(f, i * 0.08, 0.14, 'square', 0.05));
        this.nota(1568, 0.34, 0.25, 'triangle', 0.06);
    },
    erro() {
        this.nota(330, 0, 0.18, 'sawtooth', 0.05, -60);
        this.nota(220, 0.18, 0.3, 'sawtooth', 0.05, -80);
    },
    nivel() {
        const m = [523, 659, 784, 659, 784, 1047, 1319];
        m.forEach((f, i) => this.nota(f, i * 0.09, 0.16, 'square', 0.05));
        m.forEach((f, i) => this.nota(f / 2, i * 0.09, 0.16, 'triangle', 0.05));
    },
    inicio() { [392, 523, 659, 784].forEach((f, i) => this.nota(f, i * 0.07, 0.12, 'square', 0.05)); },
};
