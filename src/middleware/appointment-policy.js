function sanitizeAppointmentCreationStatus(req, _res, next) {
  const isCreationRequest = req.method === 'POST' && (req.path === '/' || req.path === '/mine');

  if (isCreationRequest && req.body && Object.prototype.hasOwnProperty.call(req.body, 'status')) {
    delete req.body.status;
  }

  return next();
}

module.exports = { sanitizeAppointmentCreationStatus };
