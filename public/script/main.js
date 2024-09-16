import { getTip } from './utils.js';

const LOBBY_TIMER_DURATION = 21000; // ms (this is 20s + 1s for the transition)
const TRANSITION_DURATION = 400; // ms

class Screen {
    constructor(id) {
        this.element = document.getElementById(id);
        this.leftBar = document.getElementById('left');
        this.rightBar = document.getElementById('right');
    }

    show() {
        this.element.dataset.visible = 'true';
        this.updateBottomBar();
    }

    hide() {
        this.element.dataset.visible = 'false';
    }

    updateBottomBar() {
        // @override
    }
}

class LoadingScreen extends Screen {
    constructor() {
        super('loading');
    }

    updateBottomBar() {
        this.leftBar.innerHTML = `<div id="bottom-title">Hint:</div><div id="bottom-desc">${getTip()}</div>`;
        this.rightBar.innerHTML = '<div id="loading-circle"></div>';
    }
}

class LobbyScreen extends Screen {
    constructor(gameManager) {
        super('lobby');
        this.gameManager = gameManager;
    }

    updateBottomBar() {
        this.leftBar.innerHTML = `<div id="bottom-desc">Lobby Code:</div><div id="bottom-title">${this.gameManager.roomId}</div>`;
        this.rightBar.innerHTML = `<div id="bottom-desc">Time Remaining:</div><div id="bottom-title"><div id="lobby-timer">Waiting for players...</div></div>`;
    }

    updatePlayerList() {
        const playerListElement = document.getElementById('characters');
        playerListElement.innerHTML = '';
        this.gameManager.players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.classList.add('character');
            playerElement.textContent = player.name;
            playerListElement.appendChild(playerElement);
        });
    }

    updateLobbyQR() {
        let qr = new QRious({
            element: document.getElementById('qr-code'),
            value: `${window.location.origin}/${this.gameManager.roomId}`,
            size: 256
        });

        document.getElementById('lobbyQR').src = qr.toDataURL();
    };
}

class GameScreen extends Screen {
    constructor() {
        super('game');
    }

    updateBottomBar() {
        this.leftBar.innerHTML = `<div id="bottom-desc">Round</div><div id="bottom-title" id="game-timer">1/3</div>`;
        this.rightBar.innerHTML = ``;
    }

    // TODO - Add game-specific methods here
}

class GameManager {
    constructor() {
        this.screens = {
            loading: new LoadingScreen(),
            lobby: new LobbyScreen(this),
            game: new GameScreen()
        };
        this.currentScreen = null;
        this.socket = io();
        this.lobbyTimer = null;
        this.lobbyTimerDuration = LOBBY_TIMER_DURATION;
        this.players = [];
        this.assets = {};
        this.roomId = document.getElementById('roomid').innerText;
    }

    async init() {
        this.setupSocketListeners();
        await this.preloadAssets();
        this.showScreen('loading');
        this.screens.lobby.updateLobbyQR();
        setTimeout(() => this.showScreen('lobby'), 1000); // TODO - Remove me
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.socket.emit('host-join', this.roomId);
        });

        this.socket.on('player-joined', (player) => {
            this.players.push(player);
            this.resetLobbyTimer();
            if (this.currentScreen === this.screens.lobby) {
                this.screens.lobby.updatePlayerList();
            }

            console.log(`${player.name} joined the game!`);
        });

        // TODO
    }

    async preloadAssets() {
        const assetUrls = [
            // TODO
        ];

        const loadPromises = assetUrls.map(url => 
            fetch(url).then(response => response.text())
        );

        const loadedAssets = await Promise.all(loadPromises);
        assetUrls.forEach((url, index) => {
            this.assets[url] = loadedAssets[index];
        });
    }

    async showScreen(screenName) {
        if (this.currentScreen) {
            await this.performTransition(this.currentScreen, this.screens[screenName]);
        }
        this.currentScreen = this.screens[screenName];
        this.currentScreen.show();
    }

    async performTransition(fromScreen, toScreen) {
        const transitionOverlay = document.getElementById('transition-overlay');
        transitionOverlay.style.transition = `transform ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        // Transition in
        transitionOverlay.style.transform = 'translateX(0%)';
        await this.delay(TRANSITION_DURATION);
        
        // Switch screens
        fromScreen.hide();
        toScreen.show();
        
        // Transition out
        transitionOverlay.style.transform = 'translateX(-100%)';
        await this.delay(TRANSITION_DURATION);
        
        // Reset overlay
        transitionOverlay.style.transition = 'none';
        transitionOverlay.style.transform = 'translateX(100%)';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startLobbyTimer() {
        this.lobbyTimer = setInterval(() => {
            this.lobbyTimerDuration -= 1000;
            if (this.lobbyTimerDuration <= 0) {
                this.startGame();
            } else {
                this.updateLobbyTimer();
            }
        }, 1000);
    }

    resetLobbyTimer() {
        clearInterval(this.lobbyTimer);
        this.lobbyTimerDuration = LOBBY_TIMER_DURATION;
        if (this.currentScreen === this.screens.lobby && this.players.length > 1) {
            this.startLobbyTimer();
        }
    }

    updateLobbyTimer() {
        const timerElement = document.getElementById('lobby-timer');
        if (timerElement) {
            // restart the animation
            timerElement.innerHTML = `${this.lobbyTimerDuration / 1000}s`;
        }
    }

    async startGame() {
        clearInterval(this.lobbyTimer);
        await this.showScreen('game');
        await this.explainRules();
        this.runGameLoop();
    }

    async explainRules() {
        console.log("Explaining game rules...");
        // ! TODO
        await this.delay(5000); // Remove me
    }

    runGameLoop() {
        // ! TODO Implement main game loop here
        console.log("Game started!");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new GameManager();
    game.init();
});