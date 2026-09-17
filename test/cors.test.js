const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCorsOptions, parseCorsOrigins } = require('../src/config/cors');

function evaluateOrigin(options, origin) {
  return new Promise((resolve) => {
    options.origin(origin, (error, allowed) => resolve({ error, allowed }));
  });
}

test('parses comma-separated CORS origins', () => {
  assert.deepEqual(
    parseCorsOrigins(
      'https://dentacare-ec0038.netlify.app, https://main--dentacare-ec0038.netlify.app/'
    ),
    ['https://dentacare-ec0038.netlify.app', 'https://main--dentacare-ec0038.netlify.app']
  );
});

test('allows configured Netlify production and main branch origins', async () => {
  const options = buildCorsOptions(
    'https://dentacare-ec0038.netlify.app,https://main--dentacare-ec0038.netlify.app'
  );

  for (const origin of [
    'https://dentacare-ec0038.netlify.app',
    'https://main--dentacare-ec0038.netlify.app'
  ]) {
    const result = await evaluateOrigin(options, origin);
    assert.equal(result.error, null);
    assert.equal(result.allowed, true);
  }
});

test('allows local Angular development and rejects unknown browser origins', async () => {
  const options = buildCorsOptions('https://dentacare-ec0038.netlify.app');

  const localResult = await evaluateOrigin(options, 'http://localhost:4200');
  assert.equal(localResult.error, null);
  assert.equal(localResult.allowed, true);

  const blockedResult = await evaluateOrigin(options, 'https://example.com');
  assert.match(blockedResult.error.message, /not allowed by CORS/);
  assert.equal(blockedResult.allowed, undefined);
});
