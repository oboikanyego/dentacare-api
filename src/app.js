const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { buildCorsOptions } = require('./config/cors');
const { sanitizeAppointmentCreationStatus } = require('./middleware/appointment-policy');

const authRoutes = require('./routes/auth.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const usersRoutes = require('./routes/users.routes');
const masterDataRoutes = require('./routes/master-data.routes');
const dentistRoutes = require('./routes/dentist.routes');

const app = express();
const clientDistPath = path.resolve(__dirname, '../../client/dist/dentacare-angular/browser');

app.use(cors(buildCorsOptions()));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/appointments', sanitizeAppointmentCreationStatus, appointmentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/dentists', dentistRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
      return next();
    }

    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

module.exports = app;
