const test = require('node:test');
const assert = require('node:assert/strict');
const { samplePassword, sampleUsers } = require('../src/utils/sample-users');

test('sample accounts cover the main application roles', () => {
  const roles = new Set(sampleUsers.map((user) => user.role));

  assert.deepEqual([...roles].sort(), ['ADMIN', 'DENTIST', 'PATIENT', 'RECEPTIONIST'].sort());
});

test('sample accounts use reserved example addresses and unique identities', () => {
  const emails = sampleUsers.map((user) => user.email);
  const ids = sampleUsers.map((user) => user.idNumber);

  assert.equal(new Set(emails).size, emails.length);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(emails.every((email) => email.endsWith('@dentacare.example')));
  assert.ok(samplePassword.length >= 8);
});
