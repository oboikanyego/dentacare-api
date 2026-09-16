const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRequiredEnvironment } = require('../src/config/env');

test('validates and normalizes required environment configuration', () => {
  const config = validateRequiredEnvironment({
    MONGO_URI: 'mongodb://localhost:27017/dentacare',
    JWT_SECRET: 'test-secret',
    PORT: '4100'
  });

  assert.equal(config.mongoUri, 'mongodb://localhost:27017/dentacare');
  assert.equal(config.jwtSecret, 'test-secret');
  assert.equal(config.port, 4100);
});

test('fails fast when required environment variables are missing', () => {
  assert.throws(
    () => validateRequiredEnvironment({ PORT: '3000' }),
    /MONGO_URI, JWT_SECRET/
  );
});
