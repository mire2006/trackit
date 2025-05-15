if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: __dirname + '/.env' });
}

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const app = express();
const path = require('path');
const pg = require('pg');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db');

const frontendURL = process.env.NODE_ENV === 'production'
                    ? process.env.FRONTEND_URL_PROD
                    : process.env.FRONTEND_URL || 'http://localhost:8080';

app.use(cors({
  origin: frontendURL,
  credentials: true
}));

app.use(express.json());

const sessionStore = new pgSession({
  pool: pool,
  tableName: 'user_sessions',
  createTableIfMissing: true,
});

const sess = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
}

app.use(session(sess));

const routes = require('./routes');

app.use((req, res, next) => {
  console.log(`APP.JS - Solicitud entrante: ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', routes);
console.log('Router principal montado en /api');

app.use('/qrcodes', express.static(path.join(__dirname, 'public/qrcodes')));


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor iniciado en el puerto ${port} en modo ${process.env.NODE_ENV || 'development'}`);
});
