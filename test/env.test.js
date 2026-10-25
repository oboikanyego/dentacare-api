const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRequiredEnvironment } = require('../src/config/env');

test('separates cluster URI and database name', () => {
  const config = validateRequiredEnvironment({
    MONGODB_URI: 'mongodb://localhost:27017/',
    MONGODB_DB_NAME: 'dentacare',
    JWT_SECRET: 'test-secret',
    PORT: '4100'
  });
  assert.equal(config.mongoUri, 'mongodb://localhost:27017/');
  assert.equal(config.mongoDbName, 'dentacare');
  assert.equal(config.jwtSecret, 'test-secret');
  assert.equal(config.port, 4100);
});
test('supports old MONGO_URI temporarily', () => {
  const config = validateRequiredEnvironment({
    MONGO_URI: 'mongodb://localhost:27017/dentacare',
    JWT_SECRET: 'test'
  });
  assert.equal(config.mongoUri, 'mongodb://localhost:27017/dentacare');
  assert.equal(config.mongoDbName, undefined);
});
test('fails when Mongo URI or JWT secret is absent', () => {
  assert.throws(() => validateRequiredEnvironment({ PORT: '3000' }), /MONGODB_URI.*JWT_SECRET/);
});
