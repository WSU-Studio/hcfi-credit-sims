// Re-export PrismaClient
const path = require('path');
const rootPath = path.resolve(__dirname, '../../../');
const clientPath = path.join(rootPath, 'node_modules', '.prisma', 'client');
const client = require(clientPath);
module.exports = client;
module.exports.default = client;
