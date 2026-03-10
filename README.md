
# 🦷 DentaCare API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express.js-REST%20API-black?style=for-the-badge&logo=express"/>
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb"/>
  <img src="https://img.shields.io/badge/JWT-Authentication-orange?style=for-the-badge"/>
</p>

<p align="center">
Backend REST API for the <b>DentaCare Clinic Management System</b>.
</p>

---

# 📌 Overview

The **DentaCare API** powers the backend services for the DentaCare platform.  
It provides RESTful endpoints for managing users, authentication, and dental appointments.

The API supports **patients, clinic staff, and administrators**, allowing secure interaction with the system through role-based access control.

This service is consumed by the **Angular frontend application**:

🔗 https://github.com/oboikanyego/dentacare-system

---

# 🚀 Features

### Authentication
- Secure user registration
- Login with JWT authentication
- Role-based access control
- Forgot password with OTP verification
- Password reset functionality

### Appointment Management
- Book dental appointments
- Select dentist and treatment type
- Prevent overlapping bookings
- Reschedule appointments
- Cancel appointments
- Track appointment status

### User Management
- Create patient accounts
- Activate or deactivate users
- Admin user management
- Role-based permissions

### Validation Rules
- Prevent booking in the past
- Prevent dentist double bookings
- Prevent patient duplicate bookings
- Respect clinic working hours

---

# 🧰 Tech Stack

| Technology | Purpose |
|-----------|--------|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication |
| Nodemailer | Email service (OTP / password reset) |
| Cloudinary | File storage |
| Swagger | API documentation |

---

# 📂 Project Structure

```
dentacare-api
│
├── src
│   ├── config
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   └── utils
│
├── server.js
├── app.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

# ⚙ Environment Configuration

Create a `.env` file in the root of the project.

Example:

```
PORT=3000

MONGO_URI=mongodb://localhost:27017/dentacare

JWT_SECRET=your_secret_key

EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

⚠️ Never commit `.env` files to Git.

---

# ▶ Running the API

### Install dependencies

```
npm install
```

### Start development server

```
npm run dev
```

### Start production server

```
npm start
```

Server runs on:

```
http://localhost:3000
```

---

# 📡 API Endpoints (Example)

### Authentication

| Method | Endpoint | Description |
|------|------|-------------|
POST | /api/auth/register | Register new user |
POST | /api/auth/login | Login user |
POST | /api/auth/forgot-password | Request password reset |
POST | /api/auth/reset-password | Reset password |

---

### Appointments

| Method | Endpoint | Description |
|------|------|-------------|
GET | /api/appointments | Get all appointments |
POST | /api/appointments | Create appointment |
PUT | /api/appointments/:id | Update appointment |
DELETE | /api/appointments/:id | Cancel appointment |

---

### Users

| Method | Endpoint | Description |
|------|------|-------------|
GET | /api/users | Get users |
PUT | /api/users/:id/status | Activate / deactivate user |

---

# 🔐 Authentication

Protected routes require a **JWT token**.

Example header:

```
Authorization: Bearer <token>
```

---

# 📘 API Documentation

Swagger documentation is available at:

```
http://localhost:3000/api/docs
```

---

# 👨‍💻 Author

Developed by:

**BK Oboikanyego Radipabe**

GitHub  
https://github.com/oboikanyego

---

# ⭐ Support

If you find this project useful, please consider giving it a ⭐ on GitHub.
