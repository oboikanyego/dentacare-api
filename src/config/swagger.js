module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'DentaCare API',
    version: '1.1.0',
    description: 'API documentation for the DentaCare full-stack dentist application.'
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Local development server'
    }
  ],
  tags: [
    { name: 'Health', description: 'Health checks' },
    { name: 'Auth', description: 'Authentication and profile endpoints' },
    { name: 'Appointments', description: 'Public, patient, and staff appointment endpoints' },
    { name: 'Users', description: 'Admin-only user management endpoints' },
    { name: 'Master Data', description: 'Dropdown and master-data endpoints' },
    { name: 'Dentists', description: 'Dentist listing endpoints' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Something went wrong' }
        }
      },
      AuthUser: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '67cafe1234567890' },
          name: { type: 'string', example: 'Clinic Admin' },
          email: { type: 'string', example: 'admin@dentacare.com' },
          role: { type: 'string', enum: ['PATIENT', 'RECEPTIONIST', 'DENTIST', 'ADMIN'] },
          isActive: { type: 'boolean', example: true },
          phone: { type: 'string', example: '+27115550101' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          password: { type: 'string', format: 'password' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Authentication successful' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/AuthUser' }
        }
      },
      Appointment: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          patientId: { type: 'string', nullable: true },
          patientName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          serviceId: { type: 'string' },
          serviceName: { type: 'string' },
          date: { type: 'string', example: '2026-03-10' },
          slotId: { type: 'string' },
          time: { type: 'string', example: '10:00' },
          reason: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] },
          bookedByRole: { type: 'string', enum: ['PUBLIC', 'PATIENT', 'RECEPTIONIST', 'DENTIST', 'ADMIN'] },
          bookedByUserId: { type: 'string', nullable: true },
          cancelledAt: { type: 'string', format: 'date-time', nullable: true },
          cancelledBy: { type: 'string', nullable: true },
          cancelReason: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateAppointmentRequest: {
        type: 'object',
        required: ['patientName', 'email', 'phone', 'date', 'time', 'serviceId', 'serviceName', 'slotId'],
        properties: {
          patientName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          date: { type: 'string', example: '2026-03-20' },
          time: { type: 'string', example: '10:00' },
          reason: { type: 'string' },
          serviceId: { type: 'string' },
          serviceName: { type: 'string' },
          slotId: { type: 'string' },
          status: { type: 'string', example: 'PENDING' }
        }
      },
      CancelAppointmentRequest: {
        type: 'object',
        properties: {
          cancelReason: { type: 'string', example: 'Patient is no longer available' }
        }
      },
      UserListItem: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['PATIENT', 'RECEPTIONIST', 'DENTIST', 'ADMIN'] },
          phone: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateUserRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'role'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          role: { type: 'string', enum: ['PATIENT', 'RECEPTIONIST', 'DENTIST', 'ADMIN'] },
          phone: { type: 'string' },
          isActive: { type: 'boolean', example: true }
        }
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string', enum: ['PATIENT', 'RECEPTIONIST', 'DENTIST', 'ADMIN'] },
          phone: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      },
      MasterDataItem: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          label: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true },
          sortOrder: { type: 'number' },
          isActive: { type: 'boolean' }
        }
      },
      MasterDataDocument: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          description: { type: 'string' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/MasterDataItem' }
          }
        }
      },
      Dentist: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          specialization: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          image: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'API health check',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a patient account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Patient registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          409: { description: 'User already exists' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in a patient or staff user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          400: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current authenticated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthUser' }
              }
            }
          },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/appointments': {
      post: {
        tags: ['Appointments'],
        summary: 'Book a public appointment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAppointmentRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Appointment booked',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' }
              }
            }
          }
        }
      },
      get: {
        tags: ['Appointments'],
        summary: 'List all appointments for staff roles',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of appointments',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Appointment' }
                }
              }
            }
          },
          403: { description: 'Forbidden' }
        }
      }
    },
    '/appointments/staff': {
      post: {
        tags: ['Appointments'],
        summary: 'Create an appointment as staff',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAppointmentRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Appointment created by staff',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' }
              }
            }
          }
        }
      }
    },
    '/appointments/mine': {
      get: {
        tags: ['Appointments'],
        summary: 'List appointments for the logged-in patient',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Patient appointments',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Appointment' }
                }
              }
            }
          }
        }
      }
    },
    '/appointments/mine/{id}/cancel': {
      patch: {
        tags: ['Appointments'],
        summary: 'Cancel a patient-owned appointment',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CancelAppointmentRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Appointment cancelled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    appointment: { $ref: '#/components/schemas/Appointment' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/appointments/{id}/cancel': {
      patch: {
        tags: ['Appointments'],
        summary: 'Cancel an appointment as staff',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CancelAppointmentRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Appointment cancelled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    appointment: { $ref: '#/components/schemas/Appointment' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserListItem' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new staff or admin user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'User created successfully'
          }
        }
      }
    },
    '/users/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Update a user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' }
            }
          }
        },
        responses: {
          200: { description: 'User updated successfully' }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Deactivate a user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'User deactivated successfully' }
        }
      }
    },
    '/master-data': {
      get: {
        tags: ['Master Data'],
        summary: 'Get one or more master-data collections',
        parameters: [
          {
            in: 'query',
            name: 'keys',
            schema: { type: 'string' },
            description: 'Comma-separated list of master-data keys, for example services,timeSlots,userRoles'
          }
        ],
        responses: {
          200: {
            description: 'Master-data collections keyed by document key',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/MasterDataItem' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/master-data/{key}': {
      get: {
        tags: ['Master Data'],
        summary: 'Get one master-data collection by key',
        parameters: [
          {
            in: 'path',
            name: 'key',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Master-data document',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MasterDataDocument' }
              }
            }
          },
          404: { description: 'Master data not found' }
        }
      }
    },
    '/dentists': {
      get: {
        tags: ['Dentists'],
        summary: 'List dentists for UI display',
        responses: {
          200: {
            description: 'Dentist list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Dentist' }
                }
              }
            }
          }
        }
      }
    },
    '/dentists/{id}': {
      get: {
        tags: ['Dentists'],
        summary: 'Get a dentist by id',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Dentist details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dentist' }
              }
            }
          },
          404: { description: 'Dentist not found' }
        }
      }
    }
  }
};
