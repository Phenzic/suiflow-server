import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';
import { logger } from './utils/logger';
import { errorHandler, notFound, jsonErrorHandler } from './middlewares/errorHandler';

const app = express();

// CORS configuration - allow localhost and production domains
const allowedOrigins = [
  'https://suiflow-frontend.vercel.app',
  'https://suiflow.vercel.app',
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

// Handle OPTIONS preflight requests (CORS middleware handles headers, we just need to respond)
app.options('*', (req: Request, res: Response) => {
  res.status(200).end();
});

// JSON parser (skip for OPTIONS)
const jsonParser = express.json();
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  jsonParser(req, res, next);
});

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/', routes);

app.use(notFound);
app.use(jsonErrorHandler); // Handle JSON parsing errors
app.use(errorHandler); // Handle other errors

export default app;


