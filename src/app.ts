import express, { type Request, type Response, type NextFunction } from 'express';
import routes from './routes';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

export default app;


