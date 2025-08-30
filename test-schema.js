// Simple schema validation test
const fs = require('fs');
const path = require('path');

function testSchemaStructure() {
  console.log('🧪 Testing database schema structure...');

  // Read and parse the Prisma schema
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found');
    return false;
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for essential models
  const requiredModels = [
    'Parent',
    'Student', 
    'Tutor',
    'Admin',
    'LearningRecord',
    'Reservation',
    'Pairing',
    'Availability',
    'CalendarEvent',
    'DriveFile',
    'Payment',
    'CRMContact',
    'MessageLink'
  ];

  let allModelsFound = true;
  
  requiredModels.forEach(model => {
    const modelRegex = new RegExp(`model\\s+${model}\\s*\\{`, 'g');
    if (!modelRegex.test(schemaContent)) {
      console.error(`❌ Model ${model} not found`);
      allModelsFound = false;
    } else {
      console.log(`✅ Model ${model} found`);
    }
  });

  // Check for essential enums
  const requiredEnums = [
    'Gender',
    'AdminRole',
    'ReservationChannel',
    'ReservationStatus', 
    'PairingStatus',
    'ExternalProvider',
    'FileOwnerType',
    'FileScope',
    'PaymentStatus',
    'CRMEntityType',
    'MessageEntityType'
  ];

  let allEnumsFound = true;
  
  requiredEnums.forEach(enumName => {
    const enumRegex = new RegExp(`enum\\s+${enumName}\\s*\\{`, 'g');
    if (!enumRegex.test(schemaContent)) {
      console.error(`❌ Enum ${enumName} not found`);
      allEnumsFound = false;
    } else {
      console.log(`✅ Enum ${enumName} found`);
    }
  });

  // Check for proper field types and constraints
  const requiredConstraints = [
    '@db.Citext', // CITEXT support
    '@db.Timestamptz', // TIMESTAMPTZ support
    '@unique',  // Unique constraints
    '@index',   // Indexes
    '@map',     // Field mapping
    '@default(cuid())', // CUID default
  ];

  let allConstraintsFound = true;
  
  requiredConstraints.forEach(constraint => {
    if (!schemaContent.includes(constraint)) {
      console.error(`❌ Constraint ${constraint} not found`);
      allConstraintsFound = false;
    } else {
      console.log(`✅ Constraint ${constraint} found`);
    }
  });

  // Check migration file exists
  const migrationDir = path.join(__dirname, 'prisma', 'migrations', '20250830000001_init');
  const migrationFile = path.join(migrationDir, 'migration.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Migration file not found');
    return false;
  } else {
    console.log('✅ Migration file found');
  }

  // Check seed file exists
  const seedFile = path.join(__dirname, 'prisma', 'seed.ts');
  if (!fs.existsSync(seedFile)) {
    console.error('❌ Seed file not found');
    return false;
  } else {
    console.log('✅ Seed file found');
  }

  return allModelsFound && allEnumsFound && allConstraintsFound;
}

// Run the test
const success = testSchemaStructure();

if (success) {
  console.log('\n🎉 All schema tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some schema tests failed!');
  process.exit(1);
}