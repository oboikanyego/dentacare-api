function validateRequiredEnvironment(env = process.env) {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !env[key]?.trim());

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    mongoUri: env.MONGO_URI,
    port: Number(env.PORT || 3000),
    jwtSecret: env.JWT_SECRET
  };
}

module.exports = { validateRequiredEnvironment };
