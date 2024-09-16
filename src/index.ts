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

// Wrap session middleware for socket.io
const wrap = (middleware: any) => (socket: Socket, next: any) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

// ----- Types ----- //
interface Player {
    id: string;
    name: string;
    avatar: number;
}

interface Room {
    id: string;
    players: Player[];
    hostSocket: string | null;
}

const rooms = new Map<string, Room>();

// ----- Avatar Encoding ----- //
const SHAPES = ['square', 'circle'];
const COLORS = ['red', 'yellow', 'green', 'blue'];

function encodeAvatar(shapeIndex: number, colorIndex: number): number {
    return (shapeIndex << 2) | colorIndex;
}

function decodeAvatar(encodedAvatar: number): { shape: string, color: string } {
    const shapeIndex = encodedAvatar >> 2;
    const colorIndex = encodedAvatar & 3;
    return {
        shape: SHAPES[shapeIndex],
        color: COLORS[colorIndex]
    };
}

// ----- Routes ----- //
app.get('/', (req, res) => {
    const roomId = createRoom();
    logger.debug(`Created room: ${roomId}`);
    res.render('index', { roomId });
});

app.get('/debug', (req, res) => {
    res.render('debug', { rooms: Array.from(rooms.values()) });
});

app.get('/:room', (req, res) => {
    const roomId = req.params.room;
    const session = req.session as any;

    if (!rooms.has(roomId)) {
        // Disband the session if the room doesn't exist anymore
        if (session.roomId && session.roomId === roomId) {
            delete session.playerId;
            delete session.roomId;
            delete session.playerName;
        }
        return res.render('mobile', { title: "Room not found", message: "The room you're trying to join doesn't exist.", type: "error" });
    }

    const room = rooms.get(roomId)!;

    // Check if the session is from a different room
    if (session.roomId && session.roomId !== roomId) {
        // Remove player from the previous room
        const previousRoom = rooms.get(session.roomId);
        if (previousRoom) {
            previousRoom.players = previousRoom.players.filter(p => p.id !== session.playerId);
            if (previousRoom.hostSocket) {
                io.to(previousRoom.hostSocket).emit('player-left', session.playerId);
            }
        }
        // Clear session data
        delete session.playerId;
        delete session.roomId;
        delete session.playerName;
    }

    if (!session.playerId) {
        const playerName = `Player ${room.players.length + 1}`; 
        const avatarCode = encodeAvatar(
            Math.floor(Math.random() * SHAPES.length),
            Math.floor(Math.random() * COLORS.length)
        );
        const player: Player = {
            id: req.sessionID,
            name: playerName,
            avatar: avatarCode
        };
        room.players.push(player);
        logger.debug(`Player "${playerName}" joined room: ${roomId}`);

        session.playerId = player.id;
        session.roomId = roomId;
        session.playerName = playerName;

        if (room.hostSocket) {
            io.to(room.hostSocket).emit('player-joined', player);
        }

        res.render('mobile', { 
            title: "You're in!", 
            message: "The game will begin shortly.", 
            type: "success",
            playerName: session.playerName,
            roomId: roomId
        });
    } else {
        res.render('mobile', { 
            title: "Already in!", 
            message: "You're already in this room, the game will begin shortly!", 
            type: "error",
            playerName: session.playerName,
            roomId: roomId
        });
    }
});


// ----- Socket.IO ----- //
io.on('connection', (socket: Socket) => {
    const session = (socket.request as any).session;
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on('host-join', (roomId: string) => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId)!;
            room.hostSocket = socket.id;
            socket.join(roomId);
            logger.debug(`Host joined room: ${roomId}`);

            // Send current players to host
            room.players.forEach(player => {
                socket.emit('player-joined', player);
            });
        }
    });

    socket.on('disconnect', () => {
        if (session.roomId && session.playerId) {
            const room = rooms.get(session.roomId);
            if (room) {
                room.players = room.players.filter(p => p.id !== session.playerId);
                if (room.hostSocket) {
                    io.to(room.hostSocket).emit('player-left', session.playerId);
                }
            }
        }
        logger.debug(`Socket disconnected: ${socket.id}`);
    });
});

// ----- Server Start ----- //
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`✨ Server listening on port ${PORT} in ${process.env.NODE_ENV} mode!`);
    logger.info(`[http://localhost:${PORT}]`);
});

// ----- Helper Functions ----- //
function createRoom(): string {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    rooms.set(roomId, { id: roomId, players: [], hostSocket: null });
    return roomId;
}