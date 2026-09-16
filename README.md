# 🦷 DentaCare API

Backend REST API for the DentaCare clinic management platform. It supports patients, reception staff, dentists, and administrators with JWT authentication, role-based authorization, appointment management, user administration, master data, dentist lookup, auditing, email notifications, and Swagger documentation.

## Tech stack

- Node.js 20+
- Express.js
- MongoDB + Mongoose
- JWT + bcrypt
- Nodemailer
- Swagger / OpenAPI
- Node built-in test runner
- GitHub Actions CI

## Core capabilities

### Authentication
- Patient registration and login
- JWT-based sessions
- Role-based access control
- Profile retrieval
- Forgot-password OTP and password reset

### Appointments
- Public appointment requests
- Patient-linked appointment creation
- Protected staff appointment creation
- Patient and staff rescheduling
- Patient and staff cancellation
- Clinic-hours validation
- Dentist overlap protection
- Patient double-booking protection
- Appointment audit trail
- Best-effort booking/cancellation email notifications

### Administration
- List users
- Create staff accounts
- Update user details and roles
- Activate/deactivate users
- Master-data endpoints
- Dentist directory

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Required environment variables:

```env
MONGO_URI=mongodb://localhost:27017/dentacare
JWT_SECRET=replace-with-a-long-random-secret
```

Optional configuration is documented in `.env.example`, including `PORT`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, Gmail app-password settings, and Cloudinary settings.

The API fails fast at startup when `MONGO_URI` or `JWT_SECRET` is missing and handles `SIGINT`/`SIGTERM` with a graceful server and MongoDB shutdown.

## Useful URLs

When running locally on the default port:

- API health: `http://localhost:3000/api/health`
- Swagger UI: `http://localhost:3000/api-docs`

## Main endpoints

### Authentication

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password` | Public |
| GET | `/api/auth/profile` | Authenticated |

### Appointments

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/appointments` | Public / optional auth |
| POST | `/api/appointments/mine` | Patient |
| GET | `/api/appointments/mine` | Patient |
| PATCH | `/api/appointments/mine/:id` | Patient |
| PATCH | `/api/appointments/mine/:id/cancel` | Patient |
| GET | `/api/appointments` | Staff/Admin |
| POST | `/api/appointments/staff` | Staff/Admin |
| PATCH | `/api/appointments/:id` | Staff/Admin |
| PATCH | `/api/appointments/:id/cancel` | Staff/Admin |

### Users

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/users` | Admin |
| POST | `/api/users` | Admin |
| PATCH | `/api/users/:id` | Admin |
| PATCH | `/api/users/:id/status` | Admin |
| DELETE | `/api/users/:id` | Admin (soft deactivate) |

## Testing and CI

Run locally:

```bash
npm run check
npm test
```

GitHub Actions runs dependency installation, syntax validation, and the API test suite on pull requests and pushes to `main`.

Current automated coverage includes health checks, required environment validation, appointment-creation policy protection, and notification-resilience behavior.

## Frontend

Angular client: https://github.com/oboikanyego/dentacare-system

## Author

BK Oboikanyego Radipabe
