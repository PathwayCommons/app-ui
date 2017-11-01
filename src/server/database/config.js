module.exports = {
  databaseName: process.env.DATABASE_NAME || 'metadataTestMk2',
  ip: process.env.DATABASE_IP || '127.0.0.1',
  tables: process.env.DATABASE_TABLES || ['version', 'graph', 'layout'],
  port: process.env.DATABASE_PORT || '28015'
};