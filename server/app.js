const express = require('express');
const cors = require('cors');
const session = require('express-session'); 
const app = express();
require('dotenv').config();
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mi_secreto', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
  })
);

const routes = require('./routes');
app.use('/api', routes);

app.use('/qrcodes', express.static(path.join(__dirname, 'public/qrcodes')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor iniciado en el puerto ${port}`);
});
