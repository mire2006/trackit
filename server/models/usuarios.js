const pool = require('../db');
const bcrypt = require('bcrypt');

async function obtenerUsuarios() {
  try {
    const [rows] = await pool.query('SELECT * FROM Usuarios');
    return rows;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}

async function crearUsuario(usuario) {
  try {
    const { Usuario, Contrasena, Rol } = usuario;

    if (!Usuario || !Contrasena || !Rol) {
      throw new Error('Faltan datos obligatorios para crear el usuario.');
    }

    if (Contrasena.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    const hashedPassword = await bcrypt.hash(Contrasena, 10); 

    const [result] = await pool.query(
      'INSERT INTO Usuarios (Usuario, Contrasena, Rol) VALUES (?, ?, ?)',
      [Usuario, hashedPassword, Rol]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
}

async function actualizarUsuario(usuario) {
  try {
    const { Usuario, Contrasena, Rol, ID_Usuario } = usuario;

    if (!Usuario || !Rol || !ID_Usuario) {
      throw new Error('Faltan datos obligatorios para actualizar el usuario.');
    }

    let hashedPassword;
    if (Contrasena) {
      if (Contrasena.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }
      hashedPassword = await bcrypt.hash(Contrasena, 10);
    }

    const query = hashedPassword
      ? 'UPDATE Usuarios SET Usuario = ?, Contrasena = ?, Rol = ? WHERE ID_Usuario = ?'
      : 'UPDATE Usuarios SET Usuario = ?, Rol = ? WHERE ID_Usuario = ?';
    const params = hashedPassword ? [Usuario, hashedPassword, Rol, ID_Usuario] : [Usuario, Rol, ID_Usuario];

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
}

async function eliminarUsuario(ID_Usuario) {
  try {
    if (!ID_Usuario) {
      throw new Error('Se requiere el ID del usuario para eliminarlo.');
    }

    const [result] = await pool.query('DELETE FROM Usuarios WHERE ID_Usuario = ?', [ID_Usuario]);
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
}

async function obtenerUsuarioPorUsuario(Usuario) {
  try {
    if (!Usuario) {
      throw new Error('Se requiere el nombre de usuario.');
    }

    const [rows] = await pool.query('SELECT * FROM Usuarios WHERE Usuario = ?', [Usuario]);
    return rows[0];
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    throw error;
  }
}

module.exports = {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerUsuarioPorUsuario,
};
