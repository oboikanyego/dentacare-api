require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const { runSeed } = require('./utils/seed');

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await runSeed();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
