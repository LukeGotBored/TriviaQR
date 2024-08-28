import express from 'express';
import { Socket } from 'socket.io';

import dotenv from 'dotenv';
dotenv.config();

import logger from './utils/logger';

logger.info(`🚀 Starting server in ${process.env.NODE_ENV} mode`);
const app = express();
const port = process.env.PORT || 5037;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/api', (req, res) => {
    res.status(418).send('I am a teapot');
});

const server = app.listen(port, () => {
    logger.info(`✨ Server listening on port ${port} [http://localhost:${port}]`);
});