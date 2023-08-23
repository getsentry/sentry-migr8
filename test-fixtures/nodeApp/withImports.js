import {Handlers, other, myOtherImport} from '@sentry/node';
import * as Sentry from '@sentry/node';

Handlers.extractRequestData();
Sentry.Handlers.extractRequestData();
other.extractRequestData();
myOtherImport();
