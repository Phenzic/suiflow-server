import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

const { port } = config;
const host = process.env.HOST || '0.0.0.0'; // Bind to 0.0.0.0 for Docker/Fly.io

const server = app.listen(port, host, () => {
  logger.info(`✅ Server listening on http://${host}:${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`SUI Network: ${config.suiNetwork}`);
  logger.info(`AI Provider: ${(config as any).aiProvider ?? 'none'}`);
  logger.debug('Node version', process.versions.node);
});

// Handle server errors
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${port} is already in use`);
  } else {
    logger.error('Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});


