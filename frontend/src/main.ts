import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { appLogger, serializeFrontendError } from './app/core/utils/app-logger';
import { LOG_EVENTS } from './app/core/utils/log-events';

try {
  await bootstrapApplication(App, appConfig);
} catch (err) {
  appLogger.error(LOG_EVENTS.FRONTEND_BOOTSTRAP_FAILED, 'Angular bootstrap failed', {
    error: serializeFrontendError(err),
  });
}
