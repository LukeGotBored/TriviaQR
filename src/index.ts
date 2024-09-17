import express from 'express';
import session from 'express-session';
import { Socket, Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import logger from './utils/logger';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessionSecret = process.env.SESSION_SECRET || (() => {
    logger.warn('!! No SESSION_SECRET provided, using insecure default !!');
    return "default";
})();

const sessionMiddleware = session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
});

app.use(sessionMiddleware);
app.use(express.static('public'));
app.set('view engine', 'pug');

// Wrappa il middleware di sessione per socket.io
const wrap = (middleware: any) => (socket: Socket, next: any) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

// ----- Types ----- //
/**
 * @typedef {Object} Player
 * @property {string} id - ID univoco del giocatore.
 * @property {string} name - Nome del giocatore.
 * @property {number[]} avatar - Avatar del giocatore, rappresentato da un array di numeri.
 * @property {string} socketId - ID del socket associato al giocatore.
 */
interface Player {
    id: string;
    name: string;
    avatar: number[];
    socketId: string;
}

/**
 * Enum che rappresenta gli stati del gioco.
 * @readonly
 * @enum {number}
 */
enum GameState {
    Waiting,
    Playing,
    Finished
}

/**
 * @typedef {Object} Room
 * @property {string} id - ID della stanza.
 * @property {Map<string, Player>} players - Mappa dei giocatori presenti nella stanza.
 * @property {string|null} hostSocket - ID del socket dell'host della stanza.
 * @property {GameState} state - Stato attuale del gioco nella stanza.
 * @property {number} createdAt - Timestamp di creazione della stanza.
 */
interface Room {
    id: string;
    players: Map<string, Player>;
    hostSocket: string | null;
    state: GameState;
    createdAt: number;
}

// ----- Costanti e variabili ----- //
const SHAPES = ['square', 'circle'];
const COLORS = ['red', 'yellow', 'green', 'blue'];
const rooms = new Map<string, Room>();
const ROOM_EXPIRY_TIME = 2 * 60 * 60 * 1000; // 2 ore in millisecondi


// ----- Funzioni Helper ----- //

/**
 * Crea una nuova stanza e la aggiunge alla mappa globale delle stanze.
 * @returns {string} L'ID della nuova stanza.
 */
function createRoom(): string {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    rooms.set(roomId, { 
        id: roomId, 
        players: new Map(), 
        hostSocket: null, 
        state: GameState.Waiting,
        createdAt: Date.now()
    });
    return roomId;
}

/**
 * Genera un nome univoco per un giocatore all'interno di una stanza.
 * @param {Room} room - La stanza in cui il giocatore si sta unendo.
 * @returns {string} Il nome univoco del giocatore.
 */
function getUniquePlayerName(room: Room): string {
    let playerNumber = 1;
    let playerName = `Player ${playerNumber}`;
    while (Array.from(room.players.values()).some(p => p.name === playerName)) {
        playerNumber++;
        playerName = `Player ${playerNumber}`;
    }
    return playerName;
}

/**
 * Genera un avatar univoco per un giocatore all'interno di una stanza.
 * @param {Room} room - La stanza in cui il giocatore si sta unendo.
 * @returns {number[]} L'avatar univoco del giocatore.
 */
function getUniqueAvatar(room: Room): number[] {
    let avatar: number[];
    do {
        avatar = [Math.floor(Math.random() * SHAPES.length), Math.floor(Math.random() * COLORS.length)];
    } while (Array.from(room.players.values()).some(p => p.avatar[0] === avatar[0] && p.avatar[1] === avatar[1]));
    return avatar;
}

/**
 * Rimuove le stanze inattive (scadute) dalla mappa globale.
 */
function cleanupInactiveRooms() {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
        if (now - room.createdAt > ROOM_EXPIRY_TIME) {
            rooms.delete(roomId);
            logger.info(`Removed inactive room: ${roomId}`);
        }
    }
}

// Esegue il cleanup ogni ora
setInterval(cleanupInactiveRooms, 60 * 60 * 1000);

// ----- Routes ----- //

/**
 * Crea una nuova stanza e reindirizza l'utente alla vista della stanza.
 */
app.get('/', (req, res) => {
    const roomId = createRoom();
    logger.debug(`Created room: ${roomId}`);
    res.render('index', { roomId });
});

/**
 * Gestisce il join di un giocatore in una stanza esistente.
 */
app.get('/room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const session = req.session as any;

    if (!rooms.has(roomId)) {
        return res.render('mobile', { title: "Room not found", message: "The room you're trying to join doesn't exist.", type: "error" });
    }

    const room = rooms.get(roomId)!;

    if (room.state !== GameState.Waiting) {
        return res.render('mobile', { title: "Game in progress", message: "Sorry, this game has already started.", type: "error" });
    }

    // Controlla se il giocatore è già nella stanza
    if (session.playerId && room.players.has(session.playerId)) {
        const player = room.players.get(session.playerId)!;
        return res.render('mobile', {
            title: `${player.name}, You're already in!`,
            message: "You're already in this room, the game will begin shortly!",
            type: "info",
            playerName: player.name,
            characterId: player.avatar,
            roomId: roomId
        });
    }

    // Crea un nuovo giocatore
    const playerName = getUniquePlayerName(room);
    const playerAvatar = getUniqueAvatar(room);
    const player: Player = {
        id: req.sessionID,
        name: playerName,
        avatar: playerAvatar,
        socketId: ''
    };

    room.players.set(player.id, player);
    logger.debug(`Player "${playerName}" joined room: ${roomId}`);

    session.playerId = player.id;
    session.roomId = roomId;
    session.playerName = playerName;

    if (room.hostSocket) {
        io.to(room.hostSocket).emit('player-joined', player);
    }

    res.render('mobile', {
        title: `${playerName}, You're in!`,
        message: "The game is about to start, hold on tight!",
        type: "success",
        playerName: playerName,
        characterId: playerAvatar,
        roomId: roomId
    });
});

/**
 * Gestisce l'invio di una risposta da parte di un giocatore durante una partita.
 */
app.get('/room/:roomId/:answer', (req, res) => {
    const roomId = req.params.roomId;
    const answer = req.params.answer;
    const session = req.session as any;

    if (!rooms.has(roomId)) {
        return res.render('mobile', { title: "Room not found", message: "The room you're trying to join doesn't exist.", type: "error" });
    }

    const room = rooms.get(roomId)!;

    if (room.state !== GameState.Playing) {
        return res.render('mobile', { title: "Game not in progress", message: "The game is not currently in progress.", type: "error" });
    }

    if (!session.playerId || !room.players.has(session.playerId)) {
        return res.render('mobile', { title: "Not in room", message: "You're not in this room.", type: "error" });
    }

    if (room.hostSocket) {
        io.to(room.hostSocket).emit('player-answer', { playerId: session.playerId, answer });
    }

    res.render('mobile', { title: "Check the screen!", message: "Hold on tight, the results are coming soon!", type: "success" });
});

// ----- Socket.IO ----- //

/**
 * Gestisce la logica di connessione e disconnessione dei socket tramite Socket.IO.
 */
io.on('connection', (socket: Socket) => {
    const session = (socket.request as any).session;
    logger.debug(`Socket connected: ${socket.id}`);

    // Evento per l'host che si unisce a una stanza
    socket.on('host-join', (roomId: string) => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId)!;
            room.hostSocket = socket.id;
            socket.join(roomId);
            logger.debug(`Host joined room: ${roomId}`);

            // Invia i giocatori all'host
            room.players.forEach(player => {
                socket.emit('player-joined', player);
            });
        }
    });

    // Evento per il giocatore che si unisce a una stanza
    socket.on('player-join', (roomId: string) => {
        if (rooms.has(roomId) && session.playerId) {
            const room = rooms.get(roomId)!;
            if (room.state !== GameState.Waiting) {
                socket.emit('game-in-progress');
                return;
            }
            const player = room.players.get(session.playerId);
            if (player) {
                player.socketId = socket.id;
                socket.join(roomId);
                logger.debug(`Player ${player.name} socket joined room: ${roomId}`);
            }
        }
    });

    // Evento per quando il gioco inizia
    socket.on('start-game', (roomId: string) => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId)!;
            if (room.hostSocket === socket.id) {
                room.state = GameState.Playing;
                io.to(roomId).emit('game-started');
                logger.debug(`Game started in room: ${roomId}`);
            }
        }
    });

    // Evento per quando il gioco finisce
    socket.on('end-game', (roomId: string) => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId)!;
            if (room.hostSocket === socket.id) {
                room.state = GameState.Finished;
                io.to(roomId).emit('game-ended');
                logger.debug(`Game ended in room: ${roomId}`);
            }
        }
    });

    // Evento per la disconnessione di un socket
    socket.on('disconnect', () => {
        if (session.roomId && session.playerId) {
            const room = rooms.get(session.roomId);
            if (room) {
                const player = room.players.get(session.playerId);
                if (player && player.socketId === socket.id) {
                    room.players.delete(session.playerId);
                    if (room.hostSocket) {
                        io.to(room.hostSocket).emit('player-left', session.playerId);
                    }
                    logger.debug(`Player ${player.name} disconnected from room: ${session.roomId}`);
                }
                if (room.hostSocket === socket.id) {
                    room.hostSocket = null;
                    io.to(session.roomId).emit('host-left');
                    logger.debug(`Host left room: ${session.roomId}`);
                }
            }
        }
        logger.debug(`Socket disconnected: ${socket.id}`);
    });
});

// Error handler globale
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err.stack || 'No stack trace available');
    res.status(500).render('error', { message: 'Something went wrong!' });
});

// ----- Avvio server ----- //
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`✨ Server listening on port ${PORT} in ${process.env.NODE_ENV} mode!`);
    logger.info(`[http://localhost:${PORT}]`);
});