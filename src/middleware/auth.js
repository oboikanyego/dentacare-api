const jwt = require('jsonwebtoken');

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
}

function authenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function optionalAuthenticate(req, _res, next) {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    req.user = null;
  }

  return next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }

    return next();
  };
}

module.exports = { authenticate, optionalAuthenticate, authorize };
