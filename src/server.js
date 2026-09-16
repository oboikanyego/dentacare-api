require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { validateRequiredEnvironment } = require('./config/env');
const { runSeed } = require('./utils/seed');

async function startServer() {
  const { mongoUri, port } = validateRequiredEnvironment();
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
  await runSeed();

  const server = app.listen(port, () => console.log(`Server running on port ${port}`));

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down DentaCare API.`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  return server;
}

startServer().catch((error) => {
  console.error('DentaCare API failed to start:', error.message);
  process.exitCode = 1;
});

module.exports = { startServer };
