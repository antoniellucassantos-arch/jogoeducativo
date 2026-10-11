// =========================================================================
// SISTEMA PRINCIPAL E CONTROLO DE ESTADOS
// =========================================================================

const APP_STATE = { 
    SCREENSAVER: 'SCREENSAVER', 
    MENU: 'MENU', 
    JOGO: 'JOGO', 
    BATALHA: 'BATALHA', 
    FEEDBACK: 'FEEDBACK' 
};

let currentState = APP_STATE.SCREENSAVER;
let isTransitioning = false; 

class TotemSystem {
    static idleTimer = 0;
    static idleLimit = 30; 
    static adInterval = null;

    static init() {
        setInterval(() => {
            if (currentState !== APP_STATE.SCREENSAVER) {
                this.idleTimer++;
                if (this.idleTimer >= this.idleLimit) {
                    this.startScreensaver();
                }
            }
        }, 1000);
        
        this.startScreensaver();
    }

    static startScreensaver() {
        currentState = APP_STATE.SCREENSAVER;
        
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById('screensaver-screen').classList.remove('hidden');
        
        const inputMatricula = document.getElementById('reg-matricula');
        if (inputMatricula) inputMatricula.value = ""; 

        const content = document.getElementById('screensaver-content');
        const anuncios = ["img/anuncio1.png", "img/anuncio2.png"];
        
        let slideAtual = 0;
        if(this.adInterval) clearInterval(this.adInterval);
        
        this.adInterval = setInterval(() => {
            slideAtual++;
            if (slideAtual >= anuncios.length) {
                content.innerHTML = `
                    <h2 style="font-size: 4rem; color: white; margin-bottom: 20px;">🏆 TOP ALUNOS</h2>
                    ${this.generateRankingHTML()}
                `;
                if (slideAtual > anuncios.length) slideAtual = -1; 
            } else {
                content.innerHTML = `<img src="${anuncios[slideAtual]}" class="ad-image">`;
            }
        }, 5000);
        
        content.innerHTML = `<img src="${anuncios[0]}" class="ad-image">`;
    }

    static generateRankingHTML() {
        const ranking = DataManager.getRanking().slice(0, 5); 
        if(ranking.length === 0) return '<p style="color:white; font-size:2.5rem;">Nenhum herói registado ainda.</p>';
        
        let html = '<table class="ranking-table"><tr><th>Posição</th><th>Matrícula</th><th>Nível</th></tr>';
        ranking.forEach((p, i) => {
            let medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
            html += `<tr><td>${medal}</td><td>${p.matricula}</td><td>Nvl ${p.level}</td></tr>`;
        });
        return html + '</table>';
    }
}

// =========================================================================
// GESTOR DE DADOS (LOCAL STORAGE)
// =========================================================================

class DataManager {
    static getPlayerData(matricula) {
        let data = null;
        try { data = localStorage.getItem('eduQuest_player_' + matricula); } catch (e) {}
        return data ? JSON.parse(data) : null;
    }

    static savePlayerData(playerObj) {
        try { localStorage.setItem('eduQuest_player_' + playerObj.matricula, JSON.stringify(playerObj)); } catch (e) {}
        this.updateRanking(playerObj);
    }

    static updateRanking(playerObj) {
        let ranking = [];
        try { ranking = JSON.parse(localStorage.getItem('eduQuest_ranking')) || []; } catch(e) {}
        
        let index = ranking.findIndex(p => p.matricula === playerObj.matricula);
        if(index >= 0) {
            ranking[index] = { matricula: playerObj.matricula, level: playerObj.level, xp: playerObj.xp };
        } else {
            ranking.push({ matricula: playerObj.matricula, level: playerObj.level, xp: playerObj.xp });
        }
        
        try { localStorage.setItem('eduQuest_ranking', JSON.stringify(ranking)); } catch(e) {}
    }

    static getRanking() {
        let ranking = [];
        try { ranking = JSON.parse(localStorage.getItem('eduQuest_ranking')) || []; } catch(e) {}
        return ranking.sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp);
    }

    static logQuestion(playerObj) {
        const today = new Date().toISOString().split('T')[0];
        if (playerObj.lastPlayDate !== today) { 
            playerObj.lastPlayDate = today; 
            playerObj.questionsToday = 0; 
        }
        playerObj.questionsToday++;
        this.savePlayerData(playerObj);
    }
}

// =========================================================================
// SISTEMA DE PERGUNTAS
// =========================================================================

class QuestionSystem {
    static db = [
        { 
            subject: 'Matemática', difficulty: 1, 
            text: 'Quanto é 15% de 200?', 
            options: ['15', '20', '30', '45'], 
            correctIndex: 2, 
            explanation: '10% de 200 é 20. 5% é 10. Somando, temos 30.' 
        },
        { 
            subject: 'História', difficulty: 1, 
            text: 'O Renascimento iniciou-se em qual país?', 
            options: ['França', 'Inglaterra', 'Itália', 'Alemanha'], 
            correctIndex: 2, 
            explanation: 'O Renascimento teve início na Itália, impulsionado pelo forte comércio.' 
        }
    ];

    static getQuestion() { 
        return this.db[Math.floor(Math.random() * this.db.length)]; 
    }
}

// =========================================================================
// MENUS
// =========================================================================

class Menu {
    static wakeUp() {
        currentState = APP_STATE.MENU;
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById('menu-screen').classList.remove('hidden');
        const inputMatricula = document.getElementById('reg-matricula');
        document.getElementById('err-matricula').classList.add('hidden'); 
        inputMatricula.value = ""; 
        setTimeout(() => inputMatricula.focus(), 100);
    }

    static validateAndStart() {
        const inputMatricula = document.getElementById('reg-matricula');
        const errorDiv = document.getElementById('err-matricula');
        const matricula = inputMatricula.value.trim();
        
        if(!matricula) {
            errorDiv.innerText = "Digite a sua matrícula!";
            errorDiv.classList.remove('hidden');
            return; 
        }

        let player = DataManager.getPlayerData(matricula);
        const today = new Date().toISOString().split('T')[0];

        if (!player) {
            player = { matricula: matricula, name: "Aluno " + matricula, level: 1, xp: 0, lastPlayDate: today, questionsToday: 0 };
        } else if (player.lastPlayDate !== today) {
            player.lastPlayDate = today; 
            player.questionsToday = 0;
        }

        if (player.questionsToday >= 2) {
            errorDiv.innerText = "Limite atingido! Volte amanhã.";
            errorDiv.classList.remove('hidden'); 
            inputMatricula.value = ""; 
            return;
        }

        DataManager.savePlayerData(player);
        currentState = APP_STATE.JOGO;
        
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById('game-screen').classList.remove('hidden');
        Game.init(player);
    }
}

// =========================================================================
// ENTIDADES (JOGADOR E INIMIGOS)
// =========================================================================

class Player {
    constructor(data) {
        this.data = data; 
        this.x = 1860; // Nasce na base do mapa
        this.y = 1700;
        this.size = 120; 
        this.speed = 10; 
        this.direction = 'up'; 
        
        this.image = new Image();
        this.image.src = 'img/player.png';
    }

    update(keys, mapWidth, mapHeight) {
        let nextX = this.x; 
        let nextY = this.y;
        
        if(keys['Numpad8'] || keys['ArrowUp']) { nextY -= this.speed; this.direction = 'up'; }
        if(keys['Numpad2'] || keys['ArrowDown']) { nextY += this.speed; this.direction = 'down'; }
        if(keys['Numpad4'] || keys['ArrowLeft']) { nextX -= this.speed; this.direction = 'left'; }
        if(keys['Numpad6'] || keys['ArrowRight']) { nextX += this.speed; this.direction = 'right'; }

        // Limites do mundo
        if(nextX < 0) nextX = 0; 
        if(nextY < 0) nextY = 0;
        if(nextX + this.size > mapWidth) nextX = mapWidth - this.size;
        if(nextY + this.size > mapHeight) nextY = mapHeight - this.size;

        // --- SISTEMA DE COLISÃO POR PÍXEL (MÁSCARA) ---
        const checkCollision = (x, y) => {
            // Se a imagem de colisão ainda não carregou, permite o movimento
            if (!Game.collisionImage.complete || Game.collisionCanvas.width === 0) return false;

            // Converte a coordenada do mundo (com scale de 2.5) para o píxel real da imagem
            const checkX = Math.floor(x / Game.mapScale);
            const checkY = Math.floor(y / Game.mapScale);

            // Previne erros fora da imagem
            if (checkX < 0 || checkX >= Game.collisionCanvas.width || checkY < 0 || checkY >= Game.collisionCanvas.height) return true;

            // Lê a cor do píxel
            const pixel = Game.collisionCtx.getImageData(checkX, checkY, 1, 1).data;
            
            // Se a cor for muito escura (quase preta), deteta colisão
            // pixel[0]=R, pixel[1]=G, pixel[2]=B. (0,0,0 é preto puro)
            return (pixel[0] < 50 && pixel[1] < 50 && pixel[2] < 50);
        };

        // Testamos os "pés" do personagem para a perspetiva Top-Down funcionar
        let marginX = 30; // Margem nas laterais
        let feetY = this.size - 20; // Ponto de contacto (pés)

        // Verifica o eixo X (Esquerda/Direita)
        let canMoveX = !checkCollision(nextX + marginX, this.y + feetY) && 
                       !checkCollision(nextX + this.size - marginX, this.y + feetY);
        
        // Verifica o eixo Y (Cima/Baixo)
        let canMoveY = !checkCollision(this.x + marginX, nextY + feetY) && 
                       !checkCollision(this.x + this.size - marginX, nextY + feetY);

        if (canMoveX) this.x = nextX; 
        if (canMoveY) this.y = nextY;
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x; 
        const drawY = this.y - camera.y;
        
        if(this.image.complete && this.image.naturalWidth !== 0) {
            let spriteW = this.image.width / 2; 
            let spriteH = this.image.height / 2;
            let col = (this.direction === 'down' || this.direction === 'left') ? 0 : 1;
            let row = (this.direction === 'down' || this.direction === 'up') ? 0 : 1;
            ctx.drawImage(this.image, col * spriteW, row * spriteH, spriteW, spriteH, drawX, drawY, this.size, this.size);
        } else { 
            ctx.fillStyle = 'green'; 
            ctx.fillRect(drawX, drawY, this.size, this.size); 
        }
    }
}

class Enemy {
    constructor(x, y, subject, color) {
        this.x = x; this.y = y; this.size = 80; this.subject = subject; this.color = color; this.active = true;
        this.dirX = (Math.random() - 0.5) * 6; this.dirY = (Math.random() - 0.5) * 6;
    }

    update(mapWidth, mapHeight) {
        if(!this.active) return;
        this.x += this.dirX; this.y += this.dirY;
        if(this.x < 0 || this.x + this.size > mapWidth) this.dirX *= -1;
        if(this.y < 0 || this.y + this.size > mapHeight) this.dirY *= -1;
    }

    draw(ctx, camera) {
        if(!this.active) return;
        const drawX = this.x - camera.x; const drawY = this.y - camera.y;
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(drawX + (this.size/2), drawY + (this.size/2), this.size/2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillText(this.subject, drawX + (this.size/2), drawY - 10);
    }
}

// =========================================================================
// O MOTOR DO JOGO
// =========================================================================

class Game {
    static canvas; static ctx; static player; static enemies = []; static keys = {};
    static camera = { x: 0, y: 0 }; static mapScale = 2.5; static bgImage = new Image();
    
    static currentEnemy = null; static currentQuestion = null; static timerInterval;

    // --- VARIÁVEIS DA MÁSCARA DE COLISÃO ---
    static collisionImage = new Image();
    static collisionCanvas;
    static collisionCtx;

    static init(playerData) {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1080; this.canvas.height = 1780;

        // Cria o ecrã (canvas) invisível para ler a imagem a preto e branco
        this.collisionCanvas = document.createElement('canvas');
        this.collisionCtx = this.collisionCanvas.getContext('2d', { willReadFrequently: true });
        
        this.bgImage.src = 'img/mapa.png'; 
        
        // Carrega a máscara de colisão
        this.collisionImage.src = 'img/mapa_colisao.png';
        this.collisionImage.onload = () => {
            this.collisionCanvas.width = this.collisionImage.width;
            this.collisionCanvas.height = this.collisionImage.height;
            this.collisionCtx.drawImage(this.collisionImage, 0, 0);
            console.log("Máscara de Colisão carregada com sucesso!");
        };

        this.player = new Player(playerData);
        this.spawnEnemies();
        this.updateHUD();
        this.loop();
    }

    static spawnEnemies() {
        this.enemies = [
            new Enemy(600, 800, 'Matemática', '#E53E3E'), 
            new Enemy(1800, 800, 'História', '#D69E2E')
        ];
    }

    static updateHUD() {
        document.getElementById('hud-name').innerText = `Matrícula: ${this.player.data.matricula}`;
        document.getElementById('hud-level').innerText = `Nível: ${this.player.data.level}`;
        document.getElementById('hud-xp').innerText = `XP: ${this.player.data.xp}`;
        document.getElementById('hud-daily').innerText = `Diário: ${this.player.data.questionsToday}/2`;
    }

    static loop() {
        if(currentState === APP_STATE.JOGO) {
            this.update();
            this.draw();
        }
        requestAnimationFrame(() => this.loop());
    }

    static update() {
        let mW = this.bgImage.naturalWidth * this.mapScale;
        let mH = this.bgImage.naturalHeight * this.mapScale;
        
        // Agora passamos apenas keys, mapWidth e mapHeight (sem obstáculos!)
        this.player.update(this.keys, mW, mH);
        
        this.camera.x = Math.max(0, Math.min(this.player.x + (this.player.size/2) - (this.canvas.width/2), mW - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.player.y + (this.player.size/2) - (this.canvas.height/2), mH - this.canvas.height));

        this.enemies.forEach(enemy => {
            enemy.update(mW, mH);
            if(enemy.active && this.checkCollision(this.player, enemy)) {
                this.triggerBattle(enemy);
            }
        });
    }

    static checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.size && rect1.x + rect1.size > rect2.x &&
               rect1.y < rect2.y + rect2.size && rect1.y + rect1.size > rect2.y;
    }

    static draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
            this.ctx.drawImage(this.bgImage, this.camera.x / this.mapScale, this.camera.y / this.mapScale, 
                this.canvas.width / this.mapScale, this.canvas.height / this.mapScale, 0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.enemies.forEach(e => e.draw(this.ctx, this.camera));
        this.player.draw(this.ctx, this.camera);
    }

    static triggerBattle(enemy) {
        currentState = APP_STATE.BATALHA; 
        this.currentEnemy = enemy;
        this.currentQuestion = QuestionSystem.getQuestion();
        
        let time = 0; document.getElementById('q-timer').innerText = time;
        this.timerInterval = setInterval(() => { time++; document.getElementById('q-timer').innerText = time; }, 1000);
        
        document.getElementById('battle-title').innerText = `Desafio de ${this.currentEnemy.subject}!`;
        document.getElementById('q-diff').innerText = this.currentQuestion.difficulty;
        document.getElementById('question-text').innerText = this.currentQuestion.text;
        
        const container = document.getElementById('options-container'); container.innerHTML = ''; 
        this.currentQuestion.options.forEach((opt, index) => {
            const btn = document.createElement('button'); btn.className = 'option-btn';
            btn.innerHTML = `<span class="numpad-badge">Numpad ${index + 1}</span> ${opt}`;
            container.appendChild(btn);
        });
        
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('battle-screen').classList.remove('hidden');
    }

    static answerQuestion(selectedIndex) {
        if(currentState !== APP_STATE.BATALHA) return; 
        currentState = APP_STATE.FEEDBACK; clearInterval(this.timerInterval);
        
        const isCorrect = (selectedIndex === this.currentQuestion.correctIndex);
        if(isCorrect) {
            this.player.data.xp += 50;
            if(this.player.data.xp >= this.player.data.level * 100) { this.player.data.xp = 0; this.player.data.level++; }
            this.currentEnemy.active = false; 
            this.showFeedback("Resposta Correta! 🏆", this.currentQuestion.explanation, true);
        } else {
            this.player.x += 150; this.player.y += 150; 
            this.showFeedback("Incorreto. 📚", this.currentQuestion.explanation, false);
        }
        
        DataManager.logQuestion(this.player.data); this.updateHUD();
    }

    static showFeedback(title, explanation, isSuccess) {
        document.getElementById('feedback-title').innerText = title;
        document.getElementById('feedback-title').style.color = isSuccess ? 'var(--success)' : 'var(--danger)';
        document.getElementById('feedback-msg').innerText = (this.player.data.questionsToday >= 2) ? "Limite diário atingido!" : (isSuccess ? `Ótimo trabalho!` : `Analise o raciocínio abaixo:`);
        document.getElementById('feedback-explanation').innerText = explanation;
        document.getElementById('feedback-modal').classList.remove('hidden');
        document.getElementById('battle-screen').classList.add('hidden');
    }

    static endBattle() {
        if(currentState !== APP_STATE.FEEDBACK) return;
        document.getElementById('feedback-modal').classList.add('hidden');
        if (this.player.data.questionsToday >= 2) { TotemSystem.startScreensaver(); return; }
        document.getElementById('game-screen').classList.remove('hidden');
        if(this.enemies.every(e => !e.active)) { this.spawnEnemies(); }
        this.keys = {}; currentState = APP_STATE.JOGO;
    }
}

// =========================================================================
// OUVINTES GLOBAIS DE TECLADO
// =========================================================================

window.addEventListener('keydown', (e) => { 
    TotemSystem.idleTimer = 0; Game.keys[e.code] = true; 
    if(e.code === 'NumpadEnter' || e.code === 'Enter') {
        if(isTransitioning) return;
        if(currentState === APP_STATE.SCREENSAVER) { isTransitioning = true; Menu.wakeUp(); setTimeout(() => { isTransitioning = false; }, 300); return; }
        if(currentState === APP_STATE.MENU) { Menu.validateAndStart(); return; }
        if(currentState === APP_STATE.FEEDBACK) { Game.endBattle(); return; }
    }
    if(currentState === APP_STATE.BATALHA) {
        if(e.code === 'Numpad1' || e.code === 'Digit1') Game.answerQuestion(0);
        if(e.code === 'Numpad2' || e.code === 'Digit2') Game.answerQuestion(1);
        if(e.code === 'Numpad3' || e.code === 'Digit3') Game.answerQuestion(2);
        if(e.code === 'Numpad4' || e.code === 'Digit4') Game.answerQuestion(3);
    }
    if(currentState === APP_STATE.JOGO && (e.code === 'Numpad0' || e.code === 'Digit0')) { TotemSystem.startScreensaver(); }
});

window.addEventListener('keyup', (e) => { Game.keys[e.code] = false; });
TotemSystem.init();