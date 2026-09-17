const test = require('node:test');
const assert = require('node:assert/strict');
const { sendBestEffort } = require('../src/services/email.service');

test('best-effort notifications do not fail the primary operation', async () => {
  const result = await sendBestEffort(async () => {
    throw new Error('SMTP unavailable');
  }, 'Test notification');

  assert.equal(result.failed, true);
  assert.equal(result.error, 'SMTP unavailable');
});

test('best-effort notifications return the successful provider response', async () => {
  const providerResult = { messageId: 'test-message' };
  const result = await sendBestEffort(async () => providerResult, 'Test notification');

  assert.deepEqual(result, providerResult);
});
