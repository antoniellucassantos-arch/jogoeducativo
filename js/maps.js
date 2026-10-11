// =========================================================================
// MAPAS DA ESCOLA
// Cada letra do "chao" é um bloco de 16x16:
//   Externo: . grama   , grama c/ flores   # piso de pedra   s terra (horta)   q quadra   H cerca viva
//   Interno: W topo da parede   F parede   d/D porta (parte de cima / de baixo)   _ piso   p madeira
//            r tapete   m capacho (saída)
// Objetos, saídas (warps) e alunos ficam listados embaixo de cada mapa.
// Os professores ficam em data/professores.js
// =========================================================================

const px = (tx, ty) => ({ x: tx * TILE + 8, y: ty * TILE + 12 }); // pé do personagem no bloco

const MAPAS = {
    patio: {
        nome: 'Pátio do Campus', ambiente: 'externo',
        chao: [
            'HHHHHHHHHHHHHHHHHHHHHH',
            'H,..................,H',
            'H....................H',
            'H....................H',
            'H,..................,H',
            'H....................H',
            'H..,..............,..H',
            'H.##################.H',
            'H.##################.H',
            'H.##################.H',
            'H.##################.H',
            'H.##################.H',
            'H.##################.H',
            'H.##################.H',
            'H.,......####.......,H',
            'H........####.qqqqqqqH',
            'H.ssssss.####.qqqqqqqH',
            'H.ssssss.####.qqqqqqqH',
            'H.ssssss.####.qqqqqqqH',
            'H.ssssss.####.qqqqqqqH',
            'H.ssssss.####.qqqqqqqH',
            'H.ssssss.####.qqqqqqqH',
            'H.ssssss.####.qqqqqqqH',
            'H........####.qqqqqqqH',
            'H.,......####.qqqqqqqH',
            'H........####.qqqqqqqH',
            'H........####.qqqqqqqH',
            'H.,......####.......,H',
            'H........####........H',
            'H...,....####....,...H',
            'H........####........H',
            'HHHHHHHHHHHHHHHHHHHHHH',
        ],
        objetos: [
            { tipo: 'predio', x: 4, y: 0, info: 'Bloco principal do IFPB. A porta leva ao corredor das salas.' },
            { tipo: 'arvore', x: 1, y: 1, dx: -6, dy: -10 }, { tipo: 'arvore', x: 18, y: 1, dx: 2, dy: -10, variante: 1 },
            { tipo: 'arbusto', x: 2, y: 4, flores: '#ff6b8b' }, { tipo: 'arbusto', x: 19, y: 4, flores: '#ffd84a' },
            { tipo: 'poste', x: 2, y: 6, dx: 2, dy: -6 }, { tipo: 'poste', x: 19, y: 6, dx: 2, dy: -6 },
            { tipo: 'fonte', x: 9, y: 9, dy: -4, info: 'Dizem que quem joga uma moeda aqui passa direto em todas as matérias...' },
            { tipo: 'banco', x: 4, y: 8 }, { tipo: 'banco', x: 16, y: 8 },
            { tipo: 'banco', x: 4, y: 12 }, { tipo: 'banco', x: 16, y: 12 },
            { tipo: 'lixeira', x: 7, y: 8, dx: 2 }, { tipo: 'lixeira', x: 14, y: 12, dx: 2, cor: '#3d7be0' },
            // horta do professor Abraão
            ...[2, 3, 4, 5, 6, 7].map((x, i) => ({ tipo: 'horta', x, y: 16, planta: i % 3 })),
            ...[2, 3, 6, 7].map((x, i) => ({ tipo: 'horta', x, y: 20, planta: (i + 1) % 3 })),
            ...[2, 3, 4, 5, 6, 7].map((x, i) => ({ tipo: 'horta', x, y: 22, planta: (i + 2) % 3 })),
            { tipo: 'regador', x: 3, y: 18, dy: 2 },
            // quadra da professora Brígida
            { tipo: 'linhasQuadra', x: 14, y: 15, w: 112, h: 192 },
            { tipo: 'cesta', x: 16, y: 12, dx: 11, dy: 10 },
            { tipo: 'banco', x: 18, y: 27, dy: -4 },
            // parte de baixo
            { tipo: 'arvore', x: 1, y: 24, dx: -4, variante: 1, frutas: true }, { tipo: 'arvore', x: 5, y: 26, dx: 0 },
            { tipo: 'arvore', x: 14, y: 27, dx: 6, dy: 2, variante: 1 }, { tipo: 'arvore', x: 18, y: 25, dx: 4, dy: 8 },
            { tipo: 'arbusto', x: 8, y: 28 }, { tipo: 'arbusto', x: 13, y: 28, flores: '#ffffff' },
            { tipo: 'arbusto', x: 1, y: 29, flores: '#ff6b5b' }, { tipo: 'arbusto', x: 20, y: 29 },
            { tipo: 'poste', x: 8, y: 23, dx: 2, dy: -6 }, { tipo: 'poste', x: 13, y: 23, dx: 2, dy: -6 },
            { tipo: 'bicicletario', x: 2, y: 23, dy: 6 },
            { tipo: 'placaIF', x: 13, y: 29, dx: 6, dy: -6, info: 'Instituto Federal da Paraíba. Bem-vindo ao EduQuest!' },
            { tipo: 'portao', x: 9, y: 31, dy: -10, info: 'O portão de entrada. Melhor ficar e estudar mais um pouco!' },
        ],
        warps: [
            { x: 160, y: 96, w: 32, h: 14, para: 'corredor', dest: px(6, 24), dir: 'up' },
        ],
        alunos: 4,
    },

    corredor: {
        nome: 'Corredor Central', ambiente: 'interno',
        chao: [
            'WWWWWWWWWWWWW',
            'WFdFFFdFFFdFW',
            'WFDFFFDFFFDFW',
            'W___________W',
            'W___________W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W____rrr____W',
            'W___________W',
            'WWWWWmmmWWWWW',
        ],
        objetos: [
            { tipo: 'placaSala', x: 1, y: 0, dx: 14, dy: 4, texto: 'SALA 1' },
            { tipo: 'placaSala', x: 5, y: 0, dx: 14, dy: 4, texto: 'SALA 2' },
            { tipo: 'placaSala', x: 9, y: 0, dx: 14, dy: 4, texto: 'SALA 3' },
            { tipo: 'mural', x: 3, y: 1, dx: 4, dy: 4 },
            { tipo: 'relogio', x: 9, y: 1, dx: 2, dy: 6 },
            { tipo: 'cartaz', x: 7, y: 1, dx: 2, dy: 3, cor: '#2f9e41', linhas: ['IF', 'PB'] },
            { tipo: 'armario', x: 3, y: 2, dy: -6, cor: '#4f86c9' }, { tipo: 'armario', x: 4, y: 2, dy: -6, cor: '#2f9e41' },
            { tipo: 'trofeus', x: 7, y: 2, dy: -4, dx: 8, info: 'Troféus dos Jogos dos Institutos Federais. Um dia o seu nome vai estar aqui!' },
            { tipo: 'vaso', x: 1, y: 3, dy: -4 }, { tipo: 'vaso', x: 11, y: 3, dy: -4 },
            { tipo: 'bebedouro', x: 11, y: 6, dy: -4, info: 'Água geladinha! Hidratar o cérebro ajuda a pensar.' },
            // cantinho de artes do professor Lídio
            { tipo: 'cavalete', x: 1, y: 7, dy: -2 }, { tipo: 'cavalete', x: 1, y: 10, dy: -2, variante: 1 },
            { tipo: 'emblema', x: 5, y: 12 },
            { tipo: 'lixeira', x: 11, y: 10, dx: 2 },
            // cantinho de leitura da professora Dayane
            { tipo: 'estante', x: 10, y: 12, dx: 1, dy: -6, info: 'Livros de Filosofia e Sociologia: Platão, Durkheim, Marx, Weber...' },
            { tipo: 'mesaLivros', x: 8, y: 15, dx: 2 },
            { tipo: 'bancoInterno', x: 1, y: 14 },
            { tipo: 'armario', x: 1, y: 18, dy: -6, cor: '#e0533d' }, { tipo: 'armario', x: 2, y: 18, dy: -6, cor: '#f2c230' }, { tipo: 'armario', x: 3, y: 18, dy: -6, cor: '#4f86c9' },
            { tipo: 'bancoInterno', x: 9, y: 20 },
            { tipo: 'vaso', x: 1, y: 23 }, { tipo: 'vaso', x: 11, y: 23 },
        ],
        warps: [
            { x: 34, y: 30, w: 12, h: 14, para: 'sala1', dest: px(6, 18), dir: 'up' },
            { x: 98, y: 30, w: 12, h: 14, para: 'sala2', dest: px(6, 18), dir: 'up' },
            { x: 162, y: 30, w: 12, h: 14, para: 'sala3', dest: px(6, 18), dir: 'up' },
            { x: 80, y: 406, w: 48, h: 10, para: 'patio', dest: { x: 176, y: 126 }, dir: 'down' },
        ],
        alunos: 3,
    },
};

// As três salas têm o mesmo formato, muda só a decoração
function criarSala(id, nome, quadro, extras) {
    return {
        nome, ambiente: 'interno',
        chao: [
            'WWWWWWWWWWWWW',
            'WFFFFFFFFFFFW',
            'WFFFFFFFFFFFW',
            ...Array(16).fill('WpppppppppppW'),
            'WWWWWWmWWWWWW',
        ],
        objetos: [
            { tipo: 'quadro', x: 4, y: 1, dy: 3, linhas: quadro, info: 'No quadro está escrito: ' + quadro.join(' / ') },
            { tipo: 'janela', x: 1, y: 1, dx: 2, dy: 4 },
            { tipo: 'relogio', x: 9, y: 1, dx: 3, dy: 3 },
            { tipo: 'mesaProf', x: 5, y: 3, dx: 2 },
            ...[2, 4, 8, 10].flatMap(x => [7, 9, 11, 13].map(y => ({ tipo: 'carteira', x, y }))),
            { tipo: 'lixeira', x: 11, y: 17, dx: 2 },
            { tipo: 'armario', x: 9, y: 16, dy: 2, cor: '#4f86c9' }, { tipo: 'armario', x: 10, y: 16, dy: 2, cor: '#2f9e41' },
            ...extras,
        ],
        warps: [{ x: 96, y: 308, w: 16, h: 10, para: 'corredor', dest: SAIDAS_SALA[id], dir: 'down' }],
        alunos: 0,
        alunosParados: 2,
    };
}

const SAIDAS_SALA = { sala1: px(2, 3), sala2: px(6, 3), sala3: px(10, 3) };

MAPAS.sala1 = criarSala('sala1', 'Sala 1 · Exatas', ['F = M.A', 'X²+Y² = R²'], [
    { tipo: 'janela', x: 10, y: 1, dx: 4, dy: 4 },
    { tipo: 'cartaz', x: 2, y: 1, dx: 11, dy: 3, cor: '#3d7be0', linhas: ['', '', 'π'], desenho: 'atomo' },
    { tipo: 'estante', x: 1, y: 16, info: 'Livros de cálculo, geometria e física.' },
    { tipo: 'vaso', x: 11, y: 15, dy: 4 },
]);
MAPAS.sala2 = criarSala('sala2', 'Sala 2 · Linguagens', ['HELLO!', 'SUJEITO+VERBO'], [
    { tipo: 'cartaz', x: 10, y: 1, dx: 4, dy: 3, cor: '#d23f7a', desenho: 'uk' },
    { tipo: 'cartaz', x: 2, y: 1, dx: 11, dy: 3, cor: '#e0533d', desenho: 'livro' },
    { tipo: 'estante', x: 1, y: 16, info: 'Machado de Assis, Clarice Lispector, Shakespeare...' },
    { tipo: 'estante', x: 3, y: 16, dx: 2, info: 'Dicionários de português e inglês.' },
    { tipo: 'vaso', x: 11, y: 15, dy: 4 },
]);
MAPAS.sala3 = criarSala('sala3', 'Sala 3 · Humanas', ['BRASIL 1500', 'ONDE ESTAMOS?'], [
    { tipo: 'mapaMundi', x: 9, y: 1, dx: 8, dy: 3, info: 'Um mapa-múndi. A Paraíba fica bem na pontinha leste das Américas!' },
    { tipo: 'cartaz', x: 2, y: 1, dx: 11, dy: 3, cor: '#b8862f', linhas: ['', 'LINHA', 'DO', 'TEMPO'] },
    { tipo: 'globo', x: 11, y: 5, dy: -2 },
    { tipo: 'estante', x: 1, y: 16, info: 'Atlas, livros de história do Brasil e da Paraíba.' },
    { tipo: 'vaso', x: 11, y: 15, dy: 4 },
]);
MAPAS.sala3.objetos = MAPAS.sala3.objetos.filter(o => !(o.tipo === 'relogio'));

// Ponto de partida do jogador
const INICIO = { mapa: 'patio', x: 176, y: 236, dir: 'up' };

// Falas dos alunos que andam pela escola (dicas do jogo)
const FALAS_ALUNOS = [
    'Dica: perguntas difíceis valem bem mais XP!',
    'Responder rápido dá bônus de XP. Mas pense antes!',
    'Cada professor tem as perguntas da sua matéria.',
    'A professora Brígida fica lá na quadra.',
    'O professor Abraão vive cuidando da horta.',
    'As salas ficam no corredor, é só entrar no prédio.',
    'Vi o professor Lídio pintando no corredor!',
    'O ranking aparece no totem quando ninguém está jogando.',
    'Você só pode responder algumas perguntas por dia. Escolha bem!',
    'Ouvi dizer que o professor Dácio explica Física com bola de basquete.',
    'Amanhã tem prova? Então bora treinar aqui!',
    'Se errar, leia a explicação. Ajuda muito!',
];
