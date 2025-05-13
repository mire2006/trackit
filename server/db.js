const mysql = require('mysql2/promise');
//require('dotenv').config({ path: __dirname + '/.env' });

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: __dirname + '/.env' });
}

if (process.env.NODE_ENV !== 'production') {
  console.log('DB_USER (dev):', process.env.DB_USER);
  // console.log('DB_PASSWORD (dev):', process.env.DB_PASSWORD); 
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Opciones adicionales para producción en Render
  // ssl: {
  //   rejectUnauthorized: true 
  // }
};

if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    // Ejemplo de cómo podrías parsear una DATABASE_URL de Render si es necesario.
    // El formato exacto dependerá de Render.
    // const url = new URL(process.env.DATABASE_URL);
    // dbConfig.host = url.hostname;
    // dbConfig.user = url.username;
    // dbConfig.password = url.password;
    // dbConfig.database = url.pathname.slice(1);
    // dbConfig.port = url.port;
    // dbConfig.ssl = { rejectUnauthorized: false }; // O lo que Render especifique
    // Por ahora, asumiremos que usaremos variables individuales. Render usualmente las provee.
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;
