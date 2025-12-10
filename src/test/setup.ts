import { connectDatabase, disconnectDatabase } from '../db/mongo';
import { connectRedis, disconnectRedis, getRedisClient } from '../db/redis';

beforeAll(async () => {
  // Connect to test database
  await connectDatabase();
  
  // Connect to Redis
  await connectRedis();
  
  // Clear Redis cache
  try {
    const redis = getRedisClient();
    await redis.flushDb();
  } catch (error) {
    console.warn('Redis clear error:', error);
  }
});

afterAll(async () => {
  // Disconnect from databases
  await disconnectDatabase();
  await disconnectRedis();
});

// Global test timeout
jest.setTimeout(30000);

// Helpful test logging: print test names and prefix all console output with the test name.
beforeEach(() => {
  const origConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  } as const;

  // store original console on global so we can restore in afterEach
  (global as any).__origConsole = origConsole;

  const testName = expect.getState().currentTestName || 'unknown-test';

  // Prefix function that writes using original console.log to avoid recursion
  const prefixer = (...args: unknown[]) => {
    origConsole.log(`[${testName}]`, ...args);
  };

  console.log = prefixer;
  console.info = prefixer;
  console.debug = prefixer;
  console.warn = (...args: unknown[]) => origConsole.log(`[${testName}] WARN`, ...args);
  console.error = (...args: unknown[]) => origConsole.log(`[${testName}] ERROR`, ...args);

  // mark start
  origConsole.log(`[TEST START] ${testName}`);
});

afterEach(() => {
  const origConsole = (global as any).__origConsole;
  const testName = expect.getState().currentTestName || 'unknown-test';
  if (origConsole && origConsole.log) {
    origConsole.log(`[TEST END] ${testName}`);

    // restore originals
    console.log = origConsole.log;
    console.info = origConsole.info;
    console.warn = origConsole.warn;
    console.error = origConsole.error;
    console.debug = origConsole.debug;

    delete (global as any).__origConsole;
  }
});
