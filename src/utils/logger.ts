import winston from 'winston';
import path from 'path';

class Logger {
    private static instance: Logger;
    private logger: winston.Logger;

    private constructor() {
        const logFormat = winston.format.printf(({ level, message, timestamp }) => {
            const colorizer = winston.format.colorize();
            return colorizer.colorize(level, `[${timestamp}] [${level.toUpperCase()}] ${message}`);
        });

        this.logger = winston.createLogger({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                logFormat
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: path.join(__dirname, 'app.log') })
            ],
        });

        winston.addColors({
            error: 'red',
            warn: 'yellow',
            info: 'green',
            debug: 'blue'
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