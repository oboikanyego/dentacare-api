const bcrypt = require('bcryptjs');
const MasterData = require('../models/MasterData');
const User = require('../models/User');
const { samplePassword, sampleUsers } = require('./sample-users');

const masterDataSeed = [
  {
    key: 'services',
    description: 'Dental services available for booking',
    items: [
      { value: 'consultation', label: 'Dental Consultation', sortOrder: 1 },
      { value: 'cleaning', label: 'Teeth Cleaning', sortOrder: 2 },
      { value: 'whitening', label: 'Teeth Whitening', sortOrder: 3 },
      { value: 'fillings', label: 'Dental Fillings', sortOrder: 4 },
      { value: 'braces', label: 'Braces Consultation', sortOrder: 5 }
    ]
  },
  {
    key: 'timeSlots',
    description: 'Bookable time slots',
    items: [
      { value: '09:00', label: '09:00', sortOrder: 1 },
      { value: '09:30', label: '09:30', sortOrder: 2 },
      { value: '10:00', label: '10:00', sortOrder: 3 },
      { value: '10:30', label: '10:30', sortOrder: 4 },
      { value: '11:00', label: '11:00', sortOrder: 5 },
      { value: '11:30', label: '11:30', sortOrder: 6 },
      { value: '12:00', label: '12:00', sortOrder: 7 },
      { value: '13:00', label: '13:00', sortOrder: 8 },
      { value: '13:30', label: '13:30', sortOrder: 9 },
      { value: '14:00', label: '14:00', sortOrder: 10 },
      { value: '14:30', label: '14:30', sortOrder: 11 },
      { value: '15:00', label: '15:00', sortOrder: 12 },
      { value: '15:30', label: '15:30', sortOrder: 13 },
      { value: '16:00', label: '16:00', sortOrder: 14 },
      { value: '16:30', label: '16:30', sortOrder: 15 }
    ]
  },
  {
    key: 'branches',
    description: 'Clinic branches',
    items: [
      { value: 'rosebank', label: 'Rosebank Clinic', sortOrder: 1 },
      { value: 'sandton', label: 'Sandton Clinic', sortOrder: 2 },
      { value: 'midrand', label: 'Midrand Clinic', sortOrder: 3 }
    ]
  },
  {
    key: 'appointmentStatuses',
    description: 'Appointment statuses',
    items: [
      { value: 'PENDING', label: 'Pending', sortOrder: 1 },
      { value: 'CONFIRMED', label: 'Confirmed', sortOrder: 2 },
      { value: 'CANCELLED', label: 'Cancelled', sortOrder: 3 },
      { value: 'COMPLETED', label: 'Completed', sortOrder: 4 },
      { value: 'NO_SHOW', label: 'No Show', sortOrder: 5 }
    ]
  },
  {
    key: 'dentists',
    description: 'Dentists available for website display and booking selections',
    items: [
      {
        value: 'dentist-1',
        label: 'Dr. Maya Vale',
        sortOrder: 1,
        metadata: {
          specialization: 'Family Dentistry',
          email: 'maya.vale@dentacare.example',
          phone: '+27 10 000 0101',
          image:
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80'
        }
      },
      {
        value: 'dentist-2',
        label: 'Dr. Theo Lane',
        sortOrder: 2,
        metadata: {
          specialization: 'Restorative Dentistry',
          email: 'theo.lane@dentacare.example',
          phone: '+27 10 000 0102',
          image:
            'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'
        }
      },
      {
        value: 'dentist-3',
        label: 'Dr. Zuri Hart',
        sortOrder: 3,
        metadata: {
          specialization: 'Cosmetic Dentistry',
          email: 'zuri.hart@dentacare.example',
          phone: '+27 10 000 0103',
          image:
            'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&q=80'
        }
      }
    ]
  },
  {
    key: 'userRoles',
    description: 'User roles',
    items: [
      { value: 'PATIENT', label: 'Patient', sortOrder: 1 },
      { value: 'RECEPTIONIST', label: 'Receptionist', sortOrder: 2 },
      { value: 'DENTIST', label: 'Dentist', sortOrder: 3 },
      { value: 'ADMIN', label: 'Admin', sortOrder: 4 }
    ]
  }
];

async function seedMasterData() {
  for (const entry of masterDataSeed) {
    await MasterData.updateOne({ key: entry.key }, { $set: entry }, { upsert: true });
  }
}

async function seedSampleUsers() {
  const hashedPassword = await bcrypt.hash(process.env.SAMPLE_USER_PASSWORD || samplePassword, 10);

  for (const user of sampleUsers) {
    await User.updateOne(
      { email: user.email },
      {
        $set: {
          ...user,
          password: hashedPassword,
          isActive: true,
          resetPasswordOtp: null,
          resetPasswordOtpExpiresAt: null
        }
      },
      { upsert: true }
    );
  }
}

async function seedConfiguredAdmin() {
  if (!process.env.SEED_ADMIN_EMAIL) {
    return;
  }

  const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || samplePassword;
  const hashedPassword = await bcrypt.hash(password, 10);

  await User.updateOne(
    { email },
    {
      $set: {
        name: process.env.SEED_ADMIN_NAME || 'Clinic Admin',
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        idNumber: process.env.SEED_ADMIN_ID_NUMBER || '8001015009087'
      }
    },
    { upsert: true }
  );
}

async function runSeed() {
  await seedMasterData();
  await seedSampleUsers();
  await seedConfiguredAdmin();
}

module.exports = { masterDataSeed, sampleUsers, runSeed, seedSampleUsers };
