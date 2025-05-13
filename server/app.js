const express = require('express');
const cors = require('cors');
const session = require('express-session'); 
const app = express();
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: __dirname + '/.env' });
}

const frontendURL = process.env.NODE_ENV === 'production' 
                    ? process.env.FRONTEND_URL_PROD
                    : 'http://localhost:8080';

app.use(cors({
  origin: frontendURL,
  credentials: true
}));

app.use(express.json());

const sess = {
  secret: process.env.SESSION_SECRET || 'una_clave_secreta_muy_fuerte_y_larga_aqui',
  resave: false,
  saveUninitialized: true,
  cookie: { 
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
app.use('/api', routes);

app.use('/qrcodes', express.static(path.join(__dirname, 'public/qrcodes')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist'))); 
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}


const port = process.env.PORT || 3000; 
app.listen(port, () => {
  console.log(`Servidor iniciado en el puerto ${port} en modo ${process.env.NODE_ENV || 'development'}`);
});
