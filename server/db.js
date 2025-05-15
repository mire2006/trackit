const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: La variable de entorno DATABASE_URL no está definida.');
  }

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false 
  }
});

pool.on('connect', (client) => {
  console.log('Cliente conectado exitosamente al pool de PostgreSQL (SSL podría estar activo si es conexión externa)');
});

pool.on('error', (err, client) => {
  console.error('Error inesperado en cliente inactivo del pool de PostgreSQL:', err);
  process.exit(-1); 
});

module.exports = pool;
