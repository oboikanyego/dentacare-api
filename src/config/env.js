function validateRequiredEnvironment(env = process.env) {
  const mongoUri = env.MONGODB_URI?.trim() || env.MONGO_URI?.trim();
  const missing = [];
  if (!mongoUri) missing.push('MONGODB_URI (or legacy MONGO_URI)');
  if (!env.JWT_SECRET?.trim()) missing.push('JWT_SECRET');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return {
    mongoUri,
    mongoDbName: env.MONGODB_DB_NAME?.trim() || undefined,
    port: Number(env.PORT || 3000),
    jwtSecret: env.JWT_SECRET
  };
}
module.exports = { validateRequiredEnvironment };
