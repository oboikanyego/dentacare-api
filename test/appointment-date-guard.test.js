const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function yesterday() {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() - 1);
  return toIsoDate(value);
}

test('public appointment creation rejects a past date before persistence', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/appointments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        patientName: 'Date Guard Patient',
        email: 'date.guard@example.test',
        phone: '0710000000',
        idNumber: '9001015009001',
        date: yesterday(),
        time: '09:00',
        serviceId: 'cleaning',
        serviceName: 'Teeth Cleaning',
        slotId: '09:00',
        dentistId: 'dentist-test',
        dentistName: 'Dr Test',
        branchId: 'sandton',
        branchName: 'Sandton Clinic',
        durationMinutes: 30,
        reason: 'Regression test'
      })
    });

    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.message, 'Appointments cannot be booked in the past');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
