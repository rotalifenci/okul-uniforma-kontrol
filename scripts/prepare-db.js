const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

if (isPostgres) {
  console.log('🔄 Configuring Prisma for PostgreSQL cloud database...');
  schema = schema.replace(/provider\s*=\s*["']?(sqlite|postgresql)["']?/g, 'provider = "postgresql"');
} else {
  console.log('🔄 Configuring Prisma for local SQLite database...');
  schema = schema.replace(/provider\s*=\s*["']?(sqlite|postgresql)["']?/g, 'provider = "sqlite"');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('✅ Prisma schema configured successfully!');
