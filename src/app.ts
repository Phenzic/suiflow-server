import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';
import { logger } from './utils/logger';
import { errorHandler, notFound, jsonErrorHandler } from './middlewares/errorHandler';

const app = express();

// CORS configuration - allow localhost and production domains
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow localhost with any port (e.g., localhost:3000, localhost:5173, 127.0.0.1:8080)
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin);
    
    // Allow production domains (add your frontend domains here)
    // Note: Origin headers don't include trailing slashes
    const allowedOrigins = [
      'https://suiflow-frontend.vercel.app',
      'https://suiflow.vercel.app',
      // Add more production domains as needed
    ];
    
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    if (isLocalhost || isAllowedOrigin) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/', routes);

app.use(notFound);
app.use(jsonErrorHandler); // Handle JSON parsing errors
app.use(errorHandler); // Handle other errors

export default app;


