import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

const { port } = config;

app.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
  logger.debug('Node version', process.versions.node);
  logger.debug('SUI network', config.suiNetwork);
  logger.debug('AI provider', (config as any).aiProvider ?? 'none');
});


