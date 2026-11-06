import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { expect } from 'bun:test';
import { config } from 'dotenv';

GlobalRegistrator.register();
config({ path: '.env.test' });

// Extend the expect object with jest-dom custom matchers. Imported only after happy-dom registers:
// jest-dom loads @testing-library/dom, whose `screen` binds to the global document at import time.
const matchers = await import('@testing-library/jest-dom/matchers');
expect.extend(matchers as any);
