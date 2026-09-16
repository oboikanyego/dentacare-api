const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeAppointmentCreationStatus } = require('../src/middleware/appointment-policy');

function runMiddleware(req) {
  let nextCalled = false;
  sanitizeAppointmentCreationStatus(req, {}, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
}

test('removes a client supplied status from public appointment creation', () => {
  const req = { method: 'POST', path: '/', body: { status: 'COMPLETED', patientName: 'Patient' } };
  runMiddleware(req);
  assert.equal(req.body.status, undefined);
  assert.equal(req.body.patientName, 'Patient');
});

test('removes a client supplied status from patient appointment creation', () => {
  const req = { method: 'POST', path: '/mine', body: { status: 'CANCELLED' } };
  runMiddleware(req);
  assert.equal(req.body.status, undefined);
});

test('preserves status updates for protected staff update routes', () => {
  const req = { method: 'PATCH', path: '/appointment-1', body: { status: 'COMPLETED' } };
  runMiddleware(req);
  assert.equal(req.body.status, 'COMPLETED');
});
