const fs = require('fs');
const path = require('path');

const defaultDir = path.join('.prisma', 'client', 'default');
const targetDir = path.join('node_modules', '.prisma', 'client');

// Create .prisma/client directory
const clientDir = path.join('.prisma', 'client');
if (!fs.existsSync(clientDir)) {
  fs.mkdirSync(clientDir, { recursive: true });
}

// Remove existing default if exists
const defaultPath = path.join(clientDir, 'default');
if (fs.existsSync(defaultPath)) {
  if (fs.lstatSync(defaultPath).isSymbolicLink()) {
    fs.unlinkSync(defaultPath);
  } else {
    fs.rmSync(defaultPath, { recursive: true, force: true });
  }
}

// Create index.js in default folder
if (fs.existsSync(targetDir)) {
  const indexJs = `// Re-export PrismaClient
const path = require('path');
const rootPath = path.resolve(__dirname, '../../../');
const clientPath = path.join(rootPath, 'node_modules', '.prisma', 'client');
const client = require(clientPath);
module.exports = client;
module.exports.default = client;
`;
  
  fs.mkdirSync(defaultPath, { recursive: true });
  fs.writeFileSync(path.join(defaultPath, 'index.js'), indexJs);
  fs.writeFileSync(path.join(defaultPath, 'package.json'), JSON.stringify({
    name: '.prisma/client/default',
    main: 'index.js',
    type: 'commonjs'
  }, null, 2));
  
  console.log('✅ Prisma client default folder created');
} else {
  console.log('⚠️  Prisma client not generated yet. Run: npx prisma generate');
}

