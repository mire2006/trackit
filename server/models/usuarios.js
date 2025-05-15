const pool = require('../db'); 
const bcrypt = require('bcrypt');

async function obtenerUsuarios() {
  try {
    const query = 'SELECT "ID_Usuario", "Nombre", "Apellido_Paterno", "Apellido_Materno", "Email", "Rol" FROM "usuarios"';
    const result = await pool.query(query);
    return result.rows;
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

    const query = `
      INSERT INTO "usuarios" ("Nombre", "Apellido_Paterno", "Apellido_Materno", "Email", "Contrasena", "Rol") 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING "ID_Usuario"
    `;
    const values = [Nombre, Apellido_Paterno, Apellido_Materno || null, Email, hashedPassword, Rol];
    const result = await pool.query(query, values);

    if (result.rows && result.rows.length > 0) {
      return result.rows[0]['ID_Usuario'];
    } else {
      throw new Error('No se pudo crear el usuario o obtener el ID.');
    }
  } catch (error) {
    if (error.code === '23505') {
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

    let placeholderIndex = 1;
    const setClauses = [];
    const queryParams = [];

    setClauses.push(`"Nombre" = $${placeholderIndex++}`);
    queryParams.push(Nombre);
    setClauses.push(`"Apellido_Paterno" = $${placeholderIndex++}`);
    queryParams.push(Apellido_Paterno);
    setClauses.push(`"Apellido_Materno" = $${placeholderIndex++}`);
    queryParams.push(Apellido_Materno || null);
    setClauses.push(`"Email" = $${placeholderIndex++}`);
    queryParams.push(Email);
    setClauses.push(`"Rol" = $${placeholderIndex++}`);
    queryParams.push(Rol);

    if (Contrasena) {
      if (Contrasena.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
      }
      const hashedPassword = await bcrypt.hash(Contrasena, 10);
      setClauses.push(`"Contrasena" = $${placeholderIndex++}`);
      queryParams.push(hashedPassword);
    }
    
    queryParams.push(ID_Usuario);

    const query = `
      UPDATE "usuarios" 
      SET ${setClauses.join(', ')} 
      WHERE "ID_Usuario" = $${placeholderIndex}
    `;
    const values = queryParams;
    
    const result = await pool.query(query, values);
    return result.rowCount;
  } catch (error) {
    if (error.code === '23505') {
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

    const query = 'DELETE FROM "usuarios" WHERE "ID_Usuario" = $1';
    const result = await pool.query(query, [ID_Usuario]);
    return result.rowCount;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    if (error.code === '23503') {
      throw new Error('No se puede eliminar el usuario porque tiene registros asociados (ej. reparaciones).');
    }
    throw error;
  }
}

async function obtenerUsuarioPorEmail(Email) {
  try {
    if (!Email) {
      throw new Error('Se requiere el email del usuario.');
    }
    const query = 'SELECT * FROM "usuarios" WHERE "Email" = $1'; 
    const result = await pool.query(query, [Email]);
    return result.rows[0]; 
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

    const query = 'SELECT "ID_Usuario", "Nombre", "Apellido_Paterno", "Apellido_Materno", "Email", "Rol" FROM "usuarios" WHERE "ID_Usuario" = $1';
    const result = await pool.query(query, [ID_Usuario]);
    return result.rows[0];
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
