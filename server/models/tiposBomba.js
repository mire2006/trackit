const pool = require('../db');

async function obtenerTodosTiposBomba() {
  try {
    const query = `
      SELECT "ID_Tipo_Bomba", "Marca", "Modelo", "Descripcion_Tecnica" 
      FROM "tipos_bomba" 
      ORDER BY "Marca" ASC, "Modelo" ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener tipos de bomba:', error);
    throw error;
  }
}

async function obtenerTipoBombaPorId(id) {
  try {
    if (isNaN(id)) {
      throw new Error('El ID del tipo de bomba debe ser un número.');
    }
    const query = 'SELECT * FROM "tipos_bomba" WHERE "ID_Tipo_Bomba" = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error al obtener tipo de bomba por ID:', error);
    throw error;
  }
}

async function crearTipoBomba(tipoBomba) {
  try {
    const { Marca, Modelo, Descripcion_Tecnica } = tipoBomba;
    if (!Marca || !Modelo) {
      throw new Error('Marca y Modelo son obligatorios.');
    }

    const query = `
      INSERT INTO "tipos_bomba" ("Marca", "Modelo", "Descripcion_Tecnica") 
      VALUES ($1, $2, $3)
      RETURNING "ID_Tipo_Bomba"
    `;
    const values = [Marca, Modelo, Descripcion_Tecnica || null];
    const result = await pool.query(query, values);

    if (result.rows && result.rows.length > 0) {
      return result.rows[0]['ID_Tipo_Bomba'];
    } else {
      throw new Error('No se pudo crear el tipo de bomba u obtener el ID.');
    }
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'UQ_Marca_Modelo') {
      throw new Error(`La combinación Marca '${Marca}' y Modelo '${Modelo}' ya existe.`);
    }
    console.error('Error al crear tipo de bomba:', error);
    throw error;
  }
}

async function actualizarTipoBomba(tipoBomba) {
  try {
    const { ID_Tipo_Bomba, Marca, Modelo, Descripcion_Tecnica } = tipoBomba;
    if (!ID_Tipo_Bomba || !Marca || !Modelo) {
      throw new Error('ID, Marca y Modelo son obligatorios para actualizar.');
    }
    if (isNaN(ID_Tipo_Bomba)) {
      throw new Error('El ID del tipo de bomba debe ser un número.');
    }

    const query = `
      UPDATE "tipos_bomba" 
      SET "Marca" = $1, "Modelo" = $2, "Descripcion_Tecnica" = $3 
      WHERE "ID_Tipo_Bomba" = $4
    `;
    const values = [Marca, Modelo, Descripcion_Tecnica || null, ID_Tipo_Bomba];
    const result = await pool.query(query, values);
    return result.rowCount;
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'UQ_Marca_Modelo') {
      throw new Error(`La combinación Marca '${Marca}' y Modelo '${Modelo}' ya existe para otro registro.`);
    }
    console.error('Error al actualizar tipo de bomba:', error);
    throw error;
  }
}

async function eliminarTipoBomba(id) {
  try {
    if (isNaN(id)) {
      throw new Error('El ID del tipo de bomba debe ser un número.');
    }
    const query = 'DELETE FROM "tipos_bomba" WHERE "ID_Tipo_Bomba" = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount;
  } catch (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar este tipo de bomba porque está siendo utilizado por una o más bombas registradas.');
    }
    console.error('Error al eliminar tipo de bomba:', error);
    throw error;
  }
}

module.exports = {
  obtenerTodosTiposBomba,
  obtenerTipoBombaPorId,
  crearTipoBomba,
  actualizarTipoBomba,
  eliminarTipoBomba,
};
