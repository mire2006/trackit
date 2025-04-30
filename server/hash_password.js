//Script para hashear contraseña con bcrypt para usar en la BBDD
const bcrypt = require('bcrypt');

//Aquí va la contraseña para el hasheo
const plainPassword = 'Iplacex.2025'; 

//Número de rondas de sal para el hash
const saltRounds = 10;

//Generar hash
bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error al generar el hash:', err);
    return;
  }
  //Imprime el hash resultante en la consola
  console.log('Contraseña original:', plainPassword);
  console.log('Hash generado:');
  console.log(hash);
  console.log('\nCopia y pega el hash generado en tu comando SQL INSERT.');
});

