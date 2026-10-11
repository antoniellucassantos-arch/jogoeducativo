// =========================================================================
// CONFIGURAÇÕES DO TOTEM
// Tudo que a escola pode querer mudar fica aqui (ou no painel: index.html?admin)
// =========================================================================

const CONFIG_PADRAO = {
    // Perguntas que cada matrícula pode responder por dia
    limiteDiario: 2,

    // Segundos sem ninguém mexer até voltar para os anúncios
    tempoOcioso: 45,

    // Segundos para responder cada pergunta (0 = sem limite)
    tempoPergunta: 60,

    // Rotação da tela: 'auto' gira -90° quando a janela está deitada (monitor do totem),
    // ou use -90, 90 ou 0 para forçar. Também dá para testar com index.html?rot=0
    rotacao: 'auto',

    // Segundos de cada slide no modo anúncio
    tempoSlide: 8,

    // Quantidade mínima de dígitos da matrícula
    digitosMatricula: 4,

    // Se true, só aceita matrículas importadas no painel (aba Alunos)
    somenteAlunosCadastrados: false,

    // Efeitos sonoros
    som: true,

    // Senha do painel da escola (index.html?admin). Deixe '' para não pedir senha.
    senhaAdmin: 'ifpb',

    // XP por dificuldade e bônus máximo por responder rápido
    xp: { 1: 30, 2: 60, 3: 100, bonusRapido: 20 },
};

// Junta o arquivo com o que foi salvo no painel de administração
const CONFIG = (() => {
    let salvo = {};
    try { salvo = JSON.parse(localStorage.getItem('eduQuest_config')) || {}; } catch (e) {}
    return Object.assign({}, CONFIG_PADRAO, salvo);
})();
