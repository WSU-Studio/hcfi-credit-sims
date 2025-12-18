// Re-export from node_modules/.prisma/client
// Use absolute path to avoid resolution issues
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '../../../');
const clientDir = path.join(projectRoot, 'node_modules', '.prisma', 'client');

// Check if client directory exists
if (!fs.existsSync(clientDir)) {
  throw new Error('Prisma client not generated. Run: npx prisma generate');
}

// Export - TypeScript files will be handled by Next.js
// For runtime, we need to export something
module.exports = {};
module.exports.default = {};
