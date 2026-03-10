const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('Email skipped: GMAIL_USER or GMAIL_APP_PASSWORD not configured');
    return { skipped: true };
  }

  return transporter.sendMail({
    from: `DentaCare <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text
  });
}

async function sendAppointmentBookedEmail(appointment) {
  const subject = 'Your DentaCare appointment is booked';
  const html = `
    <h2>Appointment booked</h2>
    <p>Hi ${appointment.patientName},</p>
    <p>Your appointment has been booked successfully.</p>
    <p><strong>Service:</strong> ${appointment.serviceName}</p>
    <p><strong>Dentist:</strong> ${appointment.dentistName || 'To be assigned'}</p>
    <p><strong>Date:</strong> ${appointment.date}</p>
    <p><strong>Time:</strong> ${appointment.time}</p>
    <p><strong>Duration:</strong> ${appointment.durationMinutes || 30} minutes</p>
    <p>We look forward to seeing you.</p>
  `;
  const text = `Appointment booked for ${appointment.serviceName} on ${appointment.date} at ${appointment.time}.`;

  return sendMail({ to: appointment.email, subject, html, text });
}

async function sendAppointmentCancelledEmail(appointment) {
  const subject = 'Your DentaCare appointment was cancelled';
  const html = `
    <h2>Appointment cancelled</h2>
    <p>Hi ${appointment.patientName},</p>
    <p>Your appointment has been cancelled.</p>
    <p><strong>Service:</strong> ${appointment.serviceName}</p>
    <p><strong>Dentist:</strong> ${appointment.dentistName || 'To be assigned'}</p>
    <p><strong>Date:</strong> ${appointment.date}</p>
    <p><strong>Time:</strong> ${appointment.time}</p>
    ${appointment.cancelReason ? `<p><strong>Reason:</strong> ${appointment.cancelReason}</p>` : ''}
  `;
  const text = `Appointment for ${appointment.serviceName} on ${appointment.date} at ${appointment.time} was cancelled.`;

  return sendMail({ to: appointment.email, subject, html, text });
}

async function sendPasswordResetOtpEmail({ name, email, otp }) {
  const subject = 'Your DentaCare password reset OTP';
  const html = `
    <h2>Password reset requested</h2>
    <p>Hi ${name || 'there'},</p>
    <p>Use the OTP below to reset your password:</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
    <p>This OTP expires in 10 minutes.</p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
  `;
  const text = `Your DentaCare password reset OTP is ${otp}. It expires in 10 minutes.`;

  return sendMail({ to: email, subject, html, text });
}

module.exports = {
  sendMail,
  sendAppointmentBookedEmail,
  sendAppointmentCancelledEmail,
  sendPasswordResetOtpEmail
};
