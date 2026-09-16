const samplePassword = ['DentaCare', '123!'].join('');

const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john.doe@dentacare.example',
    phone: '0710000101',
    idNumber: '9001015009001',
    role: 'PATIENT'
  },
  {
    name: 'Jane Doe',
    email: 'jane.doe@dentacare.example',
    phone: '0720000102',
    idNumber: '9202025009002',
    role: 'PATIENT'
  },
  {
    name: 'Riley Brooks',
    email: 'reception@dentacare.example',
    phone: '0730000103',
    idNumber: '8803035009003',
    role: 'RECEPTIONIST'
  },
  {
    name: 'Dr. Maya Vale',
    email: 'dentist@dentacare.example',
    phone: '0740000104',
    idNumber: '8504045009004',
    role: 'DENTIST'
  },
  {
    name: 'Alex Morgan',
    email: 'admin@dentacare.example',
    phone: '0750000105',
    idNumber: '8205055009005',
    role: 'ADMIN'
  }
];

module.exports = { samplePassword, sampleUsers };
