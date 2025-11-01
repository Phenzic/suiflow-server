import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';
import { logger } from './utils/logger';
import { errorHandler, notFound, jsonErrorHandler } from './middlewares/errorHandler';

const app = express();

// CORS configuration - allow localhost and production domains
const allowedOrigins = [
  'https://suivle-frontend.vercel.app',
  'https://suivle.vercel.app',
  'https://suiflow-frontend.vercel.app', // Temporary: old frontend name during migration
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    try {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }
      
      // Allow localhost with any port (e.g., localhost:3000, localhost:5173, 127.0.0.1:8080)
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin);
      
      // Check if origin is in allowed list
      const isAllowedOrigin = allowedOrigins.includes(origin);
      
      if (isLocalhost || isAllowedOrigin) {
        callback(null, true);
      } else {
        // Don't log here - logger might not be ready during CORS check
        callback(null, false);
      }
    } catch (error) {
      // Silent fail for CORS - don't log during CORS check
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

// Apply CORS before all other middleware
app.use(cors(corsOptions));

// JSON parser
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


