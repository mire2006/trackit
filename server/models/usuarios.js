const pool = require('../db');
const bcrypt = require('bcrypt');

async function obtenerUsuarios() {
  try {
    const [rows] = await pool.query(
      'SELECT ID_Usuario, Nombre, Apellido_Paterno, Apellido_Materno, Email, Rol FROM Usuarios'
    );
    return rows;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error; 
  }
}

async function crearUsuario(usuario) {
  try {
    const { Nombre, Apellido_Paterno, Apellido_Materno, Email, Contrasena, Rol } = usuario;

    if (!Nombre || !Apellido_Paterno || !Email || !Contrasena || !Rol) {
      throw new Error('Faltan datos obligatorios (Nombre, Apellido Paterno, Email, Contraseña, Rol) para crear el usuario.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
        throw new Error('Formato de Email inválido');
    }
    if (Contrasena.length < 6) { 
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    const hashedPassword = await bcrypt.hash(Contrasena, 10);

    const [result] = await pool.query(
      'INSERT INTO Usuarios (Nombre, Apellido_Paterno, Apellido_Materno, Email, Contrasena, Rol) VALUES (?, ?, ?, ?, ?, ?)',
      [Nombre, Apellido_Paterno, Apellido_Materno || null, Email, hashedPassword, Rol]
    );
    return result.insertId; 
  } catch (error) {

    if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`El email '${Email}' ya está registrado.`);
    }
    console.error('Error al crear usuario:', error);
    throw error; 
  }
}

async function actualizarUsuario(usuario) {
  try {
    const { ID_Usuario, Nombre, Apellido_Paterno, Apellido_Materno, Email, Contrasena, Rol } = usuario;

    if (!ID_Usuario || !Nombre || !Apellido_Paterno || !Email || !Rol) {
      throw new Error('Faltan datos obligatorios (ID, Nombre, Apellido Paterno, Email, Rol) para actualizar el usuario.');
    }
     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
        throw new Error('Formato de Email inválido');
    }

    let query;
    let params;
    let hashedPassword;

    if (Contrasena) {
      if (Contrasena.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
      }
      hashedPassword = await bcrypt.hash(Contrasena, 10);
      query = `UPDATE Usuarios 
                 SET Nombre = ?, Apellido_Paterno = ?, Apellido_Materno = ?, Email = ?, Contrasena = ?, Rol = ? 
                 WHERE ID_Usuario = ?`;
      params = [Nombre, Apellido_Paterno, Apellido_Materno || null, Email, hashedPassword, Rol, ID_Usuario];
    } else {
      query = `UPDATE Usuarios 
                 SET Nombre = ?, Apellido_Paterno = ?, Apellido_Materno = ?, Email = ?, Rol = ? 
                 WHERE ID_Usuario = ?`;
      params = [Nombre, Apellido_Paterno, Apellido_Materno || null, Email, Rol, ID_Usuario];
    }

    const [result] = await pool.query(query, params);
    return result.affectedRows; 
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`El email '${Email}' ya está registrado por otro usuario.`);
    }
    console.error('Error al actualizar usuario:', error);
    throw error; 
  }
}

async function eliminarUsuario(ID_Usuario) {
  try {
    if (!ID_Usuario) {
      throw new Error('Se requiere el ID del usuario para eliminarlo.');
    }

    if (isNaN(ID_Usuario)) {
      throw new Error('El ID del usuario debe ser un número.');
    }

    const [result] = await pool.query('DELETE FROM Usuarios WHERE ID_Usuario = ?', [ID_Usuario]);
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
}

async function obtenerUsuarioPorEmail(Email) {
  try {
    if (!Email) {
      throw new Error('Se requiere el email del usuario.');
    }

    const [rows] = await pool.query('SELECT * FROM Usuarios WHERE Email = ?', [Email]);
    return rows[0]; 
  } catch (error) {
    console.error('Error al obtener el usuario por email:', error);
    throw error;
  }
}

async function obtenerUsuarioPorId(ID_Usuario) {
    try {
        if (!ID_Usuario) {
            throw new Error('Se requiere el ID del usuario.');
        }
        if (isNaN(ID_Usuario)) {
          throw new Error('El ID del usuario debe ser un número.');
        }

        const [rows] = await pool.query(
            'SELECT ID_Usuario, Nombre, Apellido_Paterno, Apellido_Materno, Email, Rol FROM Usuarios WHERE ID_Usuario = ?', 
            [ID_Usuario]
        );
        return rows[0]; 
    } catch (error) {
        console.error('Error al obtener el usuario por ID:', error);
        throw error;
    }
}


module.exports = {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerUsuarioPorEmail, 
  obtenerUsuarioPorId,   
};

