# EduQuest IFPB

Jogo educativo em pixel art para o totem do campus (tela em pé, 1080×1920, controlado pelo teclado numérico).
O aluno digita a matrícula, escolhe um personagem, anda pela escola e conversa com os professores.
Cada professor faz uma pergunta da sua matéria; acertar dá XP, sobe de nível e coloca o aluno no ranking.
Quando ninguém está jogando, o totem mostra os anúncios do IF, o ranking e os professores.

## Como rodar

Não precisa instalar nada. Abra o `index.html` no **Google Chrome** (ou Edge).

No totem, o ideal é abrir em tela cheia (modo quiosque):

```
chrome.exe --kiosk --autoplay-policy=no-user-gesture-required "file:///C:/caminho/jogoeducativo/index.html"
```

- Aberto pelo arquivo (`file://`) com o monitor deitado, a tela gira sozinha. Pelo site (GitHub Pages) ela fica em pé. Se ficar de cabeça para baixo, mude `rotacao` em
  `js/config.js` (ou na aba **Configurações** do painel) para `90`.
- Para testar no computador sem girar: `index.html?rot=0`
- Para testar com teclado na tela (celular): `index.html?rot=0&teclado`

## Controles (teclado numérico)

| Tecla | O que faz |
|---|---|
| `8` `4` `6` `2` | andar (as setas e WASD também funcionam) |
| `5` ou `ENTER` | conversar / continuar |
| `1` `2` `3` `4` | escolher a dificuldade e responder |
| `0` | sair do jogo (aperte de novo para confirmar) |
| `.` | apagar um número da matrícula |
| `-` | voltar |

## O jogo

- **5 lugares:** Pátio, Corredor e as Salas 1 (Exatas), 2 (Linguagens) e 3 (Humanas).
- **10 professores**, cada um no seu canto:

| Professor | Matéria | Onde fica |
|---|---|---|
| Genival | Matemática | Sala 1 |
| Dácio | Física | Sala 1 |
| Lisboa | Português | Sala 2 |
| Ana Angélica | Inglês | Sala 2 |
| Janaína | História | Sala 3 |
| Leonardo | Geografia | Sala 3 |
| Dayane | Filosofia e Sociologia | Corredor (cantinho de leitura) |
| Lídio | Artes | Corredor (cantinho de artes) |
| Abraão | Biologia | Pátio (horta) |
| Brígida | Educação Física | Pátio (quadra) |

- Professores com **!** ainda têm desafio para o aluno hoje; com **✓** já foram respondidos.
- **Dificuldade:** o aluno escolhe Fácil (+30 XP), Médio (+60 XP) ou Difícil (+100 XP). Responder rápido dá até +20 XP de bônus. Errar vale +5 XP pela tentativa.
- **Limite por dia:** 2 desafios por matrícula (dá para mudar).
- O jogo não repete pergunta para o mesmo aluno até ele responder todas daquele nível.
- **Ranking** geral e da semana, salvos no próprio totem.

## Painel da escola

Abra `index.html?admin` (senha padrão: `ifpb`, troque em `js/config.js`). Lá dá para:

- **Perguntas:** ver quantas perguntas tem cada matéria e importar mais por planilha (CSV).
- **Alunos:** importar a lista `matricula;nome;turma` para o jogo mostrar o nome do aluno.
- **Anúncios:** enviar imagens de anúncios sem mexer em arquivo.
- **Ranking:** ver todos os alunos, baixar a planilha ou zerar.
- **Configurações:** limite diário, tempo para responder, tempo parado até voltar aos anúncios, rotação, XP, som.
- **Backup:** salvar e restaurar tudo (importante antes de trocar de computador).

> Tudo fica salvo no navegador do totem. Se limpar os dados do Chrome, o ranking some. Faça backup!

## Como mudar as coisas

### Professores (aparência e lugar)
`data/professores.js`. Os personagens são desenhados pelo código, então dá para deixar mais parecido
com cada professor mudando pele, cabelo (`curto`, `careca`, `longo`, `cacheado`, `crespo`, `rabo`, `coque`...),
cor do cabelo, roupa, óculos, barba e acessórios (`gravata`, `apito`, `boina`, `brincos`...).
Também ficam ali as falas de cada um e onde ele aparece no mapa.

### Perguntas
São ~920 perguntas que vêm com o jogo, separadas por matéria em `data/perguntas/`, com 3 níveis de dificuldade.
Cada linha é:

```js
[dificuldade, 'pergunta', 'resposta certa', 'errada 1', 'errada 2', 'errada 3', 'explicação'],
```

A resposta certa pode ficar sempre em primeiro: o jogo embaralha na hora.

Para colocar muitas perguntas de uma vez, use uma planilha no formato do `modelo-perguntas.csv`
e importe pelo painel. Dá para gerar perguntas com IA pedindo algo como:

> Crie 50 perguntas de múltipla escolha de Biologia para o ensino médio, em CSV separado por ponto e vírgula,
> com as colunas `materia;dificuldade;pergunta;correta;errada1;errada2;errada3;explicacao`,
> matéria `biologia` e dificuldade 1, 2 ou 3.

Sempre confira as respostas antes de importar.

### Anúncios
Coloque as imagens em `img/anuncios/` e liste em `data/anuncios.js` (ou envie pelo painel).
Os avisos em texto também ficam nesse arquivo.

### Mapas
`js/maps.js`. Cada mapa é um desenho com letras (cada letra é um bloco do chão) mais a lista de objetos,
portas e alunos.

## Arquivos

```
index.html            telas do jogo
css/style.css         visual
js/config.js          configurações
js/sprites.js         gerador dos personagens em pixel art
js/tiles.js           chão e objetos do cenário
js/maps.js            mapas da escola
js/world.js           movimento, colisão, câmera
js/game.js            fluxo do jogo e teclado
js/ui.js              HUD, diálogos e modo anúncio
js/storage.js         jogadores, ranking e níveis
js/questions.js       sorteio e importação de perguntas
js/audio.js           efeitos sonoros 8-bit
js/admin.js           painel da escola
data/                 professores, anúncios e perguntas
fonts/                fontes (licença OFL)
```

Fontes: Press Start 2P, Silkscreen e Nunito (SIL Open Font License, em `fonts/`).
