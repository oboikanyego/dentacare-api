const LOCAL_DEVELOPMENT_ORIGINS = ['http://localhost:4200', 'http://127.0.0.1:4200'];

function parseCorsOrigins(value = '') {
  return String(value)
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function buildCorsOptions(value = process.env.CORS_ORIGIN || '') {
  const configuredOrigins = parseCorsOrigins(value);
  const allowAll = configuredOrigins.includes('*');
  const allowedOrigins = new Set([
    ...LOCAL_DEVELOPMENT_ORIGINS,
    ...configuredOrigins.filter((origin) => origin !== '*')
  ]);

  return {
    credentials: true,
    origin(origin, callback) {
      // Requests without an Origin header are server-to-server, health checks,
      // or same-origin requests and are safe to continue.
      if (!origin || allowAll || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  };
}

module.exports = {
  buildCorsOptions,
  parseCorsOrigins
};
