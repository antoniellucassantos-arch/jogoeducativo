// =========================================================================
// PROFESSORES
// A aparência é desenhada em pixel art pelo código (js/sprites.js).
// Para deixar mais parecido com o professor de verdade, mude:
//   pele, cabelo ('curto','espetado','careca','longo','ondulado','cacheado','crespo','rabo','coque'),
//   corCabelo, roupa ('camisa','polo','blazer','jaleco','esporte','vestido','avental'),
//   corRoupa, corRoupa2 (camisa por dentro / gravata / detalhe), corCalca, oculos, barba
//   ('cheia','cavanhaque','bigode'), acessorios ['gravata','apito','brincos','colar','boina','cachecol','tiara']
// mapa / x / y = onde ele fica (em blocos do mapa). direcao = para onde olha.
// =========================================================================

const MATERIAS = {
    matematica:  { nome: 'Matemática',     cor: '#3d7be0', icone: '➗' },
    portugues:   { nome: 'Português',      cor: '#e0533d', icone: '📖' },
    ingles:      { nome: 'Inglês',         cor: '#d23f7a', icone: '🇬🇧' },
    filosofia:   { nome: 'Filosofia',      cor: '#8a5cd6', icone: '🦉' },
    sociologia:  { nome: 'Sociologia',     cor: '#6c63c9', icone: '👥' },
    biologia:    { nome: 'Biologia',       cor: '#2f9e41', icone: '🧬' },
    fisica:      { nome: 'Física',         cor: '#1f9bb8', icone: '⚛️' },
    edfisica:    { nome: 'Educação Física', cor: '#f08a24', icone: '🏀' },
    geografia:   { nome: 'Geografia',      cor: '#3aa59a', icone: '🌎' },
    historia:    { nome: 'História',       cor: '#b8862f', icone: '🏛️' },
    artes:       { nome: 'Artes',          cor: '#e0a21f', icone: '🎨' },
};

const PROFESSORES = [
    {
        id: 'genival', nome: 'Genival', materias: ['matematica'],
        mapa: 'sala1', x: 3, y: 4, direcao: 'down',
        look: { genero: 'm', pele: '#d9a47a', cabelo: 'curto', corCabelo: '#3a3434', roupa: 'camisa', corRoupa: '#9cc3e8', corRoupa2: '#24365e', corCalca: '#3a3f4f', oculos: true, barba: 'bigode', acessorios: ['gravata'] },
        falas: {
            ola: ['Olá! Vamos exercitar esse raciocínio lógico?', 'Matemática é treino: quanto mais você faz, mais fácil fica!'],
            feito: 'Por hoje já resolvemos nossa conta. Volte amanhã!',
        },
    },
    {
        id: 'dacio', nome: 'Dácio', materias: ['fisica'],
        mapa: 'sala1', x: 9, y: 4, direcao: 'down',
        look: { genero: 'm', pele: '#c98e66', cabelo: 'careca', corCabelo: '#4a3a30', roupa: 'polo', corRoupa: '#2f4a7a', corCalca: '#2c2f38', oculos: false, barba: 'cavanhaque', acessorios: [] },
        falas: {
            ola: ['Tudo no universo segue leis. Vamos descobrir algumas?', 'Pronto para sentir a força da Física?'],
            feito: 'Sua energia de hoje já foi gasta. Amanhã tem mais!',
        },
    },
    {
        id: 'lisboa', nome: 'Lisboa', materias: ['portugues'],
        mapa: 'sala2', x: 3, y: 4, direcao: 'down',
        look: { genero: 'm', pele: '#e2b48c', cabelo: 'curto', corCabelo: '#4b3527', roupa: 'blazer', corRoupa: '#7a5236', corRoupa2: '#f4f1ea', corCalca: '#3b3530', oculos: true, barba: 'cheia', acessorios: [] },
        falas: {
            ola: ['Bom dia! A língua portuguesa é cheia de surpresas.', 'Vírgula, crase, concordância... preparado?'],
            feito: 'Já tivemos nossa aula de hoje. Até amanhã!',
        },
    },
    {
        id: 'ana', nome: 'Ana Angélica', materias: ['ingles'],
        mapa: 'sala2', x: 9, y: 4, direcao: 'down',
        look: { genero: 'f', pele: '#edc3a0', cabelo: 'longo', corCabelo: '#b07a3e', roupa: 'vestido', corRoupa: '#d9486f', corCalca: '#2f2f3a', oculos: false, acessorios: ['brincos'] },
        falas: {
            ola: ['Hello, student! Ready for a challenge?', 'Let\'s practice some English today!'],
            feito: 'See you tomorrow! Já respondeu por hoje.',
        },
    },
    {
        id: 'janaina', nome: 'Janaína', materias: ['historia'],
        mapa: 'sala3', x: 3, y: 4, direcao: 'down',
        look: { genero: 'f', pele: '#b97a52', cabelo: 'ondulado', corCabelo: '#2e1f1a', roupa: 'vestido', corRoupa: '#d39b2a', corCalca: '#3a2f2a', oculos: true, corOculos: '#7a2b2b', acessorios: ['colar'] },
        falas: {
            ola: ['Quem não conhece a História está condenado a repeti-la!', 'Vamos viajar no tempo?'],
            feito: 'Por hoje a nossa viagem no tempo acabou. Volte amanhã!',
        },
    },
    {
        id: 'leonardo', nome: 'Leonardo', materias: ['geografia'],
        mapa: 'sala3', x: 9, y: 4, direcao: 'down',
        look: { genero: 'm', pele: '#d6a07a', cabelo: 'espetado', corCabelo: '#5a3b26', roupa: 'polo', corRoupa: '#5d7a3a', corCalca: '#4a4036', oculos: false, barba: 'cheia', acessorios: [] },
        falas: {
            ola: ['O mundo é grande! Vamos explorar um pedaço dele?', 'Relevo, clima, população... bora?'],
            feito: 'Já exploramos o mapa hoje. Amanhã tem mais!',
        },
    },
    {
        id: 'dayane', nome: 'Dayane', materias: ['filosofia', 'sociologia'],
        mapa: 'corredor', x: 10, y: 15, direcao: 'left',
        look: { genero: 'f', pele: '#a8714d', cabelo: 'cacheado', corCabelo: '#24170f', roupa: 'vestido', corRoupa: '#7a4fc2', corCalca: '#2d2638', oculos: true, acessorios: ['brincos'] },
        falas: {
            ola: ['"Só sei que nada sei." Vamos pensar juntos?', 'A sociedade e o pensamento: duas grandes perguntas.'],
            feito: 'Reflita sobre o que vimos hoje. Até amanhã!',
        },
    },
    {
        id: 'lidio', nome: 'Lídio', materias: ['artes'],
        mapa: 'corredor', x: 3, y: 9, direcao: 'right',
        look: { genero: 'm', pele: '#cf9a74', cabelo: 'curto', corCabelo: '#2b2522', roupa: 'avental', corRoupa: '#3c3f52', corRoupa2: '#efe6d2', corBoina: '#8b2f3c', corCalca: '#33343f', oculos: false, barba: 'cavanhaque', acessorios: ['boina'] },
        falas: {
            ola: ['A arte está em todo lugar. Vamos ver se você repara?', 'Pincéis a postos! Hora de um desafio artístico.'],
            feito: 'Sua obra de hoje está completa. Volte amanhã!',
        },
    },
    {
        id: 'abraao', nome: 'Abraão', materias: ['biologia'],
        mapa: 'patio', x: 5, y: 18, direcao: 'right',
        look: { genero: 'm', pele: '#b07a55', cabelo: 'crespo', corCabelo: '#1f1814', roupa: 'jaleco', corRoupa: '#3d8f55', corCalca: '#33415a', oculos: false, barba: 'cheia', acessorios: [] },
        falas: {
            ola: ['A vida está em cada folha dessa horta! Vamos estudar?', 'Células, genes, ecossistemas... pronto?'],
            feito: 'A horta já foi regada hoje. Até amanhã!',
        },
    },
    {
        id: 'brigida', nome: 'Brígida', materias: ['edfisica'],
        mapa: 'patio', x: 17, y: 17, direcao: 'down',
        look: { genero: 'f', pele: '#e0a983', cabelo: 'rabo', corCabelo: '#3b2418', roupa: 'esporte', corRoupa: '#2f9e41', corRoupa2: '#ffffff', corCalca: '#1f3b2a', oculos: false, acessorios: ['apito'] },
        falas: {
            ola: ['Aquecimento feito? Então bora pro desafio!', 'Corpo e mente em movimento!'],
            feito: 'Treino de hoje concluído! Descanse e volte amanhã.',
        },
    },
];
