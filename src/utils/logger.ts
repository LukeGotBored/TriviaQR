/**
 * @file logger.ts
 * @description Questo file è un wrapper per il modulo winston, che fornisce funzionalità di logging.
 * @module utils/logger
 * @version 1.0.0
 * 
 * @author @LukeGotBored
 * 
 * @license MIT
 * 
 * @classdesc Questa classe è un singleton che fornisce un'interfaccia per il modulo winston.
 **/

import winston from 'winston';

class Logger {
    private static instance: Logger;
    private logger: winston.Logger;

    private constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(({ level, message, timestamp }) => {
                    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
            ],
        });
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public debug(message: string): void {
        this.logger.debug(message);
    }

    public info(message: string): void {
        this.logger.info(message);
    }

    public warn(message: string): void {
        this.logger.warn(message);
    }

    public error(message: string): void {
        this.logger.error(message);
    }
}

export default Logger.getInstance();