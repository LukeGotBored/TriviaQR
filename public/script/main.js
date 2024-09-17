/**
 * @fileoverview Gestisce la logica principale del gioco quiz multiplayer.
 * @author @LukeGotBored
 * @version 0.3.0 // now with commenti :D (yippie!)
 */

import { getTip, characterBuilder, calculateScore, delay } from './utils.js';

/**
 * Oggetto che definisce le durate delle varie fasi del gioco.
 * @type {Object.<string, number>}
 */
const DURATIONS = {
    /** Tempo di attesa nella lobby */
    LOBBY_TIMER: 16000, // ms
    /** Durata della transizione tra schermate */
    TRANSITION: 400,
    /** Durata dell'introduzione di ogni round */
    ROUND_INTRO: 3000,
    /** Durata della visualizzazione della domanda */
    QUESTION_DISPLAY: 5000,
    /** Tempo per rispondere a una domanda */
    QUESTION_ANSWER: 20000,
    /** Durata della schermata del punteggio finale */
    LEADERBOARD: 10000,
    /** Durata della visualizzazione della risposta corretta */
    ANSWER_REVEAL: 3000
};

/**
 * Classe per gestire le schermate del gioco.
 * 
 */
class Screen {
    /**
     * Crea una nuova istanza di Screen.
     * @param {string} id - L'ID dell'elemento DOM che rappresenta la schermata.
     */
    constructor(id) {
        this.element = document.getElementById(id);
        this.leftBar = document.getElementById('left');
        this.rightBar = document.getElementById('right');
    }

    /**
     * Mostra la schermata.
     */
    show() {
        if (this.element) {
            this.element.dataset.visible = 'true';
            this.updateBottomBar();
        }
    }

    /**
     * Nasconde la schermata.
     */
    hide() {
        if (this.element) {
            this.element.dataset.visible = 'false';
        }
    }

    /**
     * Aggiorna la barra inferiore. Da implementare nelle sottoclassi.
     * @abstract
     */
    updateBottomBar() { }

    /**
     * Imposta il contenuto di un elemento.
     * @param {string} contentId - L'ID dell'elemento di cui impostare il contenuto.
     * @param {string} text - Il testo da impostare come contenuto.
     */
    setContent(contentId, text) {
        const element = document.getElementById(contentId);
        if (element) {
            element.textContent = text;
            element.style.display = 'block';
        }
    }

    /**
     * Nasconde il contenuto di un elemento.
     * @param {string} contentId - L'ID dell'elemento da nascondere.
     */
    hideContent(contentId) {
        const element = document.getElementById(contentId);
        if (element) {
            element.style.display = 'none';
        }
    }
}

/**
 * Classe per la schermata di caricamento.
 * @extends Screen
 */
class LoadingScreen extends Screen {
    /**
     * Crea una nuova istanza di LoadingScreen.
     */
    constructor() {
        super('loading');
    }

    /**
     * Aggiorna la barra inferiore
     * In questo caso, a sinistra viene visualizzato un suggerimento casuale e a destra un cerchio di caricamento.
     */
    updateBottomBar() {
        if (this.leftBar && this.rightBar) {
            this.leftBar.innerHTML = `<div id="bottom-title">Hint:</div><div id="bottom-desc">${getTip()}</div>`;
            this.rightBar.innerHTML = '<div id="loading-circle"></div>';
        }
    }
}

/**
 * Classe per la schermata della lobby.
 * @extends Screen
 */
class LobbyScreen extends Screen {
    /**
     * Crea una nuova istanza di LobbyScreen.
     * @param {GameManager} gameManager - Il gestore del gioco.
     */
    constructor(gameManager) {
        super('lobby');
        this.gameManager = gameManager;
    }

    /**
     * Aggiorna la barra inferiore con il codice della stanza e il timer della lobby.
     */
    updateBottomBar() {
        if (this.leftBar && this.rightBar) {
            this.leftBar.innerHTML = `<div id="bottom-desc">Lobby Code:</div><div id="bottom-title">${this.gameManager.roomId}</div>`;
            this.rightBar.innerHTML = `<div id="bottom-desc">Time Left:</div><div id="bottom-title"><div id="lobby-timer">Waiting for players...</div></div>`;
        }
    }

    /**
     * Aggiorna la lista dei giocatori nella lobby.
     */
    updatePlayerList() {
        const playerListElement = document.getElementById('characters');
        const ingamePlayerList = document.getElementById('ingame-char');
        if (playerListElement) {
            const currentPlayers = Array.from(playerListElement.children).map(child => child.dataset.playerId);
            const newPlayers = this.gameManager.players.map(player => player.id);

            // Aggiunge i nuovi giocatori che si sono uniti
            this.gameManager.players.forEach(player => {
                if (!currentPlayers.includes(player.id)) {
                    const playerElement = document.createElement('div');
                    playerElement.dataset.playerId = player.id;
                    playerElement.innerHTML = characterBuilder(player.avatar);
                    playerListElement.appendChild(playerElement);
                }
            });

            // Replica i giocatori nella lista ingame
            if (ingamePlayerList) {
                ingamePlayerList.innerHTML = playerListElement.innerHTML;
            }
        }
    }

    /**
     * Aggiorna il codice QR della lobby.
     */
    updateLobbyQR() {
        const qrElement = document.getElementById('lobbyQR');
        if (qrElement && typeof QRious !== 'undefined') {
            new QRious({
                element: qrElement,
                value: `${window.location.origin}/room/${this.gameManager.roomId}`,
                size: 256
            });
        }
    }
}

/**
 * Classe per la schermata di gioco principale.
 * @extends Screen
 */
class GameScreen extends Screen {
    /**
     * Crea una nuova istanza di GameScreen.
     * @param {GameManager} gameManager - Il gestore del gioco.
     */
    constructor(gameManager) {
        super('game');
        this.gameManager = gameManager;
        this.questionTimer = null;
    }

    /**
     * Aggiorna la barra inferiore
     * A sinistra viene visualizzato il numero del round corrente e a destra il numero della domanda corrente.
     */
    updateBottomBar() {
        if (this.leftBar && this.rightBar) {
            this.leftBar.innerHTML = `<div id="bottom-desc">Round</div><div id="bottom-title" id="game-round">${this.gameManager.currentRound + 1}/${this.gameManager.totalRounds}</div>`;
            this.rightBar.innerHTML = `<div id="bottom-desc">Question</div><div id="bottom-title" id="game-question">${this.gameManager.currentQuestion + 1}/${this.gameManager.questionsPerRound}</div>`;
        }
    }

    /**
     * Visualizza una domanda.
     * @param {Object} question - L'oggetto domanda da visualizzare.
     */
    async displayQuestion(question) {
        this.setContent('question', question.question);
        const questionElement = document.getElementById('question');
        if (questionElement) {
            await delay(DURATIONS.TRANSITION / 2);
            questionElement.style.animation = 'none';
            document.getElementById('grid').style.display = 'none';
            document.getElementById('grid').offsetHeight; // Trigger reflow
            questionElement.style.animation = 'intro 5s forwards';
            await delay(DURATIONS.QUESTION_DISPLAY);
            document.getElementById('grid').style.display = 'grid';
        }

        // Visualizza le opzioni di risposta nella struttura a griglia
        const answers = [...question.incorrect_answers, question.correct_answer];
        answers.sort(() => Math.random() - 0.5); // Mescola le risposte 

        for (let i = 1; i <= 4; i++) {
            const wrapperElement = document.getElementById(`answer${i}-wrapper`);
            const textElement = document.getElementById(`answer${i}-text`);
            const qrElement = document.getElementById(`answer${i}-qr`);

            if (i <= answers.length) {
                wrapperElement.style = `display: flex; align-items: center; justify-content: center; flex-direction: ${i > 2 ? 'row-reverse' : 'row'};`;
                textElement.style.boxShadow = i > 2 ? '10px 10px #000' : '-10px 10px #000';
                textElement.textContent = answers[i - 1];
                // Genera il codice QR per la risposta
                new QRious({
                    element: qrElement,
                    value: `${window.location.origin}/room/${this.gameManager.roomId}/${[i - 1]}`,
                    size: 100 // Regola la dimensione secondo necessità
                });
            }
        }
    }

    /**
     * Avvia il timer per la domanda.
     * @param {number} duration - La durata del timer in secondi.
     */
    startQuestionTimer(duration) {
        this.clearQuestionTimer();
        let timeLeft = duration;
        this.setContent('timer', `${timeLeft}s`);

        this.questionTimer = setInterval(() => {
            timeLeft--;
            this.setContent('timer', `${timeLeft}s`);
            if (timeLeft <= 0) {
                this.clearQuestionTimer();
            }
        }, 1000);
    }

    /**
     * Cancella il timer della domanda.
     */
    clearQuestionTimer() {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        }
    }

    /**
     * Aggiorna le risposte dei giocatori.
     * @param {string} playerName - Il nome del giocatore.
     * @param {string} playerId - L'ID del giocatore.
     * @param {boolean} isCorrect - Indica se la risposta del giocatore è corretta.
     */
    updatePlayerAnswers(playerName, playerId, isCorrect) {
        let playerAvatar = document.querySelector(`[data-player-id="${playerId}"]`).firstElementChild;
        playerAvatar.classList.add("answered")
        if(isCorrect) {
            playerAvatar.classList.add("correct");
        }
    }

    /**
     * Cancella le risposte dei giocatori.
     */
    clearPlayerAnswers() {
        const playerAnswersElement = document.getElementById('player-answers');
        if (playerAnswersElement) {
            playerAnswersElement.innerHTML = '';
        }
    }
}

/**
 * Classe per la schermata della classifica.
 * @extends Screen
 */
class LeaderboardScreen extends Screen {
    /**
     * Crea una nuova istanza di LeaderboardScreen.
     */
    constructor() {
        super('leaderboard');
    }

    /**
     * Aggiorna la classifica.
     * @param {Object.<string, number>} scores - Un oggetto che mappa i nomi dei giocatori ai loro punteggi.
     */
    updateLeaderboard(scores) {
        const leaderboardElement = document.getElementById('leaderboard-list');
        if (leaderboardElement) {
            const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
            leaderboardElement.innerHTML = sortedPlayers.map(([playerName, score], index) =>
                `<div class="lb-wrapper"><div class="lb-plrn">${playerName}</div> <div class="lb-score">${score}</div></div>`
            ).join('');
            leaderboardElement.innerHTML = '<div style="font-size: 2rem; text-align: center; margin-bottom: 1rem; font-weight: 500;">LEADERBOARD</div>' + leaderboardElement.innerHTML;
        }
    }
}

/**
 * Classe principale per la gestione del gioco.
 */
class GameManager {
    /**
     * Crea una nuova istanza di GameManager.
     */
    constructor() {
        this.screens = {
            loading: new LoadingScreen(),
            lobby: new LobbyScreen(this),
            game: new GameScreen(this),
            leaderboard: new LeaderboardScreen(),
            intro: new Screen('intro')
        };
        this.currentScreen = null;
        this.socket = io();
        this.lobbyTimer = null;
        this.lobbyTimerDuration = DURATIONS.LOBBY_TIMER;
        this.players = [];
        this.assets = {};
        this.roomId = document.getElementById('roomid')?.innerText || '';

        this.currentRound = 0;
        this.totalRounds = 3;
        this.questionsPerRound = 3;
        this.currentQuestion = 0;
        this.roundQuestions = [];
        this.scores = {};
        this.currentQuestionData = null;
    }

    /**
     * Inizializza il gioco.
     */
    async init() {
        this.setupSocketListeners();
        await this.showScreen('loading');
        this.screens.lobby.updateLobbyQR();
        setTimeout(() => this.showScreen('lobby'), 1000);
    }

/**
     * Configura i listener per gli eventi socket.
     */
setupSocketListeners() {
    this.socket.on('connect', () => this.socket.emit('host-join', this.roomId));

    this.socket.on('player-joined', (player) => {
        this.players.push(player);
        this.scores[player.name] = 0;
        if(this.players.length >= 2) {
            this.resetLobbyTimer();
        }
        if (this.currentScreen === this.screens.lobby) {
            this.screens.lobby.updatePlayerList();
        }
        console.log(`${player.name} joined!`);
    });

    this.socket.on('player-answer', (data) => {
        let player = this.players.find(player => player.id === data.playerId);
        this.handlePlayerAnswer(player.name, player.id, data.answer);
    });

    this.socket.on('start-game', () => {
        this.startGame();
    });
}

/**
 * Mostra una schermata specifica.
 * @param {string} screenName - Il nome della schermata da mostrare.
 */
async showScreen(screenName) {
    if (this.currentScreen) {
        await this.performTransition(this.currentScreen, this.screens[screenName]);
    }
    this.currentScreen = this.screens[screenName];
    this.currentScreen.show();
}

/**
 * Esegue una transizione tra due schermate.
 * @param {Screen} fromScreen - La schermata di partenza.
 * @param {Screen} toScreen - La schermata di destinazione.
 */
async performTransition(fromScreen, toScreen) {
    const transitionOverlay = document.getElementById('transition-overlay');
    if (!transitionOverlay) return;

    transitionOverlay.style.transition = `transform ${DURATIONS.TRANSITION}ms cubic-bezier(0.4, 0, 0.2, 1)`;

    transitionOverlay.style.transform = 'translateX(0%)';
    await delay(DURATIONS.TRANSITION);

    fromScreen.hide();
    toScreen.show();

    transitionOverlay.style.transform = 'translateX(-100%)';
    await delay(DURATIONS.TRANSITION);

    transitionOverlay.style.transition = 'none';
    transitionOverlay.style.transform = 'translateX(100%)';
}


/**
 * Avvia il timer della lobby.
 */
startLobbyTimer() {
    clearInterval(this.lobbyTimer);
    this.lobbyTimer = setInterval(() => {
        this.lobbyTimerDuration -= 1000;
        if (this.lobbyTimerDuration <= 0) {
            this.startGame();
        } else {
            this.updateLobbyTimer();
        }
    }, 1000);
}

/**
 * Resetta il timer della lobby.
 */
resetLobbyTimer() {
    clearInterval(this.lobbyTimer);
    this.lobbyTimerDuration = DURATIONS.LOBBY_TIMER;
    if (this.currentScreen === this.screens.lobby) {
        this.startLobbyTimer();
    }
}

/**
 * Aggiorna il timer della lobby nell'interfaccia utente.
 */
updateLobbyTimer() {
    const timerElement = document.getElementById('lobby-timer');
    if (timerElement) {
        timerElement.textContent = `${this.lobbyTimerDuration / 1000}s`;
    }
}

/**
 * Avvia il gioco.
 */
async startGame() {
    clearInterval(this.lobbyTimer);
    this.socket.emit('start-game', this.roomId);
    await this.runGameLoop();
}

/**
 * Esegue il loop principale del gioco.
 */
async runGameLoop() {
    document.getElementById("bottom-right").innerHTML = ""; // https://media.tenor.com/-MrMt3zY6OwAAAAj/caught-emote-caught-emoji.gif
    for (this.currentRound = 0; this.currentRound < this.totalRounds; this.currentRound++) {
        await this.showScreen('loading');
        this.roundQuestions = await this.fetchRoundQuestions(this.currentRound);
        this.currentScreen.setContent('round-intro', `Round ${this.currentRound + 1}`);
        await this.showScreen('intro');
        await delay(DURATIONS.ROUND_INTRO);
        this.showScreen('game');

        for (this.currentQuestion = 0; this.currentQuestion < this.questionsPerRound; this.currentQuestion++) {
            this.showScreen('game');
            await this.askQuestion(this.roundQuestions.questions[this.currentQuestion]);
            this.screens.game.updateBottomBar();
        }

        await this.showLeaderboard();
    }

    await this.endGame();
}

/**
 * Gestisce una singola domanda del gioco.
 * @param {Object} question - L'oggetto domanda da gestire.
 */
async askQuestion(question) {
    this.currentQuestionData = question;
    this.screens.game.clearPlayerAnswers();
    await delay(DURATIONS.TRANSITION / 2);
    for (let i = 1; i <= 4; i++) {
        const qrElement = document.getElementById(`answer${i}-qr`);
        if (qrElement) {
            qrElement.style.display = "block";
        }
    }
    document.getElementById('game-grid').style.display = 'none';
    document.getElementById('game-grid').style.animation = 'none';
    document.getElementById('game-grid').offsetHeight; // Trigger reflow

    document.getElementById('timer').style.display = 'none';
    document.getElementById('timer').style.animation = 'none';
    document.getElementById('timer').offsetHeight; // Trigger reflow
    await this.screens.game.displayQuestion(question);

    this.screens.game.startQuestionTimer(DURATIONS.QUESTION_ANSWER / 1000);
    
    document.getElementById('game-grid').style.display = 'grid';
    document.getElementById('timer').style.display = 'block';
    document.getElementById('game-grid').style.animation = 'popIn2 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
    await delay(DURATIONS.QUESTION_ANSWER);

    this.screens.game.clearQuestionTimer();
    this.currentScreen.hideContent('timer');

    this.revealCorrectAnswer();

    await delay(DURATIONS.ANSWER_REVEAL);
}

/**
 * Gestisce la risposta di un giocatore.
 * @param {string} playerName - Il nome del giocatore.
 * @param {string} playerId - L'ID del giocatore.
 * @param {string} answer - La risposta del giocatore.
 */
handlePlayerAnswer(playerName, playerId, answer) {
    if (this.currentQuestionData) {
        let availableAnswers = Array.from(document.getElementsByClassName('answer')).map(answerElement => answerElement.textContent);
        const isCorrect = parseInt(answer) === availableAnswers.indexOf(this.currentQuestionData.correct_answer);

        let player = this.players.find(player => player.id === playerId);
        if (player.isCorrect !== undefined) {
            if (player.isCorrect) {
                this.scores[playerName] -= calculateScore(this.currentQuestionData.difficulty);
            } else {
                let playerElement = document.querySelector(`[data-player-id="${player.id}"]`).firstElementChild;
                if (playerElement.classList.contains("correct")) {
                    playerElement.classList.remove("correct");
                }
            }
        }

        player.isCorrect = isCorrect;

        if (isCorrect) {
            this.scores[playerName] = (this.scores[playerName] || 0) + calculateScore(this.currentQuestionData.difficulty);
        }

        this.screens.game.updatePlayerAnswers(playerName, playerId, isCorrect);
    }
}

/**
 * Rivela la risposta corretta.
 */
revealCorrectAnswer() {
    if (this.currentQuestionData) {
        let availableAnswers = Array.from(document.getElementsByClassName('answer')).map(answerElement => answerElement.textContent);
        for (let i = 1; i <= 4; i++) {
            const wrapperElement = document.getElementById(`answer${i}-wrapper`);
            if (wrapperElement) {
                if (wrapperElement.querySelector(`#answer${i}-text`).textContent === this.currentQuestionData.correct_answer) {
                    wrapperElement.classList.add('correct-answer');
                    wrapperElement.querySelector(`#answer${i}-qr`).style.display = "none";
                } else {
                    wrapperElement.classList.add('incorrect-answer');
                    wrapperElement.querySelector(`#answer${i}-qr`).style.display = "none";
                }
            }
        }

        this.players.forEach(player => {
            let playerElement = document.querySelector(`[data-player-id="${player.id}"]`).firstElementChild;
            if (!playerElement.classList.contains("correct")) {
                playerElement.classList.remove("answered");
            }
        });

        delay(DURATIONS.ANSWER_REVEAL).then(() => {
            for (let i = 1; i <= 4; i++) {
                const wrapperElement = document.getElementById(`answer${i}-wrapper`);
                if (wrapperElement) {
                    wrapperElement.classList.remove('correct-answer', 'incorrect-answer');
                }
            }
            
            this.players.forEach(player => {
                let playerElement = document.querySelector(`[data-player-id="${player.id}"]`).firstElementChild;
                if (playerElement.classList.contains("answered")) {
                    playerElement.classList.remove("answered");
                }

                if (playerElement.classList.contains("correct")) {
                    playerElement.classList.remove("correct");
                }

                player.isCorrect = undefined
            });
        });
    }
}

/**
 * Mostra la schermata della classifica.
 */
async showLeaderboard() {
    this.screens.leaderboard.updateLeaderboard(this.scores);
    await this.showScreen('leaderboard');
    await delay(DURATIONS.LEADERBOARD);
}

/**
 * Termina il gioco.
 */
async endGame() {
    await this.restartGame();
    this.socket.emit('end-game', this.roomId);
}

/**
 * Recupera le domande per un round.
 * @param {number} round - Il numero del round.
 * @returns {Promise<Object>} Un oggetto contenente le domande e la difficoltà del round.
 */
async fetchRoundQuestions(round) {
    const difficulties = ['easy', 'medium', 'hard'];
    const difficulty = difficulties[round] || 'easy';

    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=${this.questionsPerRound}&difficulty=${difficulty}&type=multiple`);
        const data = await response.json();

        if (data.response_code !== 0) {
            console.log('Failed to fetch questions from the API:', data);
            throw new Error('Failed to fetch questions from the API');
        }

        const decodeHTML = (html) => {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
        };

        const questions = data.results.map(question => ({
            ...question,
            question: decodeHTML(question.question),
            correct_answer: decodeHTML(question.correct_answer),
            incorrect_answers: question.incorrect_answers.map(answer => decodeHTML(answer))
        }));

        return {
            questions: questions,
            difficulty: difficulty
        };
    } catch (error) {
        console.error('Couldn\'t fetch questions:', error);
        return {
            questions: this.getDefaultQuestions(),
            difficulty: difficulty
        };
    }
}

/**
 * Restituisce un set di domande predefinite in caso di errore nel recupero dall'API.
 * @returns {Array<Object>} Un array di oggetti domanda predefiniti.
 */
getDefaultQuestions() {
    return [
        {
            question: "What is the capital of France?",
            correct_answer: "Paris",
            incorrect_answers: ["London", "Berlin", "Madrid"]
        },
        {
            question: "Who wrote 'Romeo and Juliet'?",
            correct_answer: "William Shakespeare",
            incorrect_answers: ["Charles Dickens", "Jane Austen", "Mark Twain"]
        },
        {
            question: "What is the largest planet in our solar system?",
            correct_answer: "Jupiter",
            incorrect_answers: ["Saturn", "Mars", "Earth"]
        }
    ];
}

/**
 * Riavvia il gioco.
 */
async restartGame() {
    await this.showScreen('loading');
    window.location.reload()
}
}

// Inizializza il gioco quando il DOM è completamente caricato
document.addEventListener('DOMContentLoaded', () => {
const game = new GameManager();
game.init();
});

// Aggiunge un event listener per il pulsante di avvio del gioco nella lobby
const startGameButton = document.getElementById('start-game-button');
if (startGameButton) {
startGameButton.addEventListener('click', () => {
    // Emette un evento 'start-game' al server
    game.socket.emit('start-game', game.roomId);
});
}