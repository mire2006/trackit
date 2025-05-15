const pool = require('../db');

async function obtenerTiposServicioActivos() {
  try {
    const query = `
      SELECT "ID_Tipo_Servicio", "Nombre" 
      FROM "tipos_servicio" 
      WHERE "Activo" = TRUE 
      ORDER BY "Nombre" ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener tipos de servicio activos:', error);
    throw error;
  }
}

async function obtenerTodosTiposServicio() {
  try {
    const query = `
      SELECT "ID_Tipo_Servicio", "Nombre", "Descripcion", "Activo" 
      FROM "tipos_servicio" 
      ORDER BY "Nombre" ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener todos los tipos de servicio:', error);
    throw error;
  }
}

async function crearTipoServicio(tipoServicio) {
  try {
    const { Nombre, Descripcion } = tipoServicio;
    if (!Nombre) {
      throw new Error('El nombre del tipo de servicio es obligatorio.');
    }
    const query = `
      INSERT INTO "tipos_servicio" ("Nombre", "Descripcion") 
      VALUES ($1, $2)
      RETURNING "ID_Tipo_Servicio"
    `;
    const values = [Nombre, Descripcion || null];
    const result = await pool.query(query, values);

    if (result.rows && result.rows.length > 0) {
      return result.rows[0]['ID_Tipo_Servicio'];
    } else {
      throw new Error('No se pudo crear el tipo de servicio u obtener el ID.');
    }
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'UQ_Nombre_Tipo_Servicio') {
      throw new Error(`El tipo de servicio '${Nombre}' ya existe.`);
    }
    console.error('Error al crear tipo de servicio:', error);
    throw error;
  }
}

async function actualizarTipoServicio(tipoServicio) {
  try {
    const { ID_Tipo_Servicio, Nombre, Descripcion, Activo } = tipoServicio;
    if (!ID_Tipo_Servicio || !Nombre || typeof Activo === 'undefined') {
      throw new Error('ID, Nombre y Estado Activo son obligatorios para actualizar.');
    }
    const activoParaDb = (String(Activo).toLowerCase() === 'true' || Activo === 1 || Activo === true);


    const query = `
      UPDATE "tipos_servicio" 
      SET "Nombre" = $1, "Descripcion" = $2, "Activo" = $3 
      WHERE "ID_Tipo_Servicio" = $4
    `;
    const values = [Nombre, Descripcion || null, activoParaDb, ID_Tipo_Servicio];
    const result = await pool.query(query, values);
    return result.rowCount;
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'UQ_Nombre_Tipo_Servicio') {
      throw new Error(`El nombre de tipo de servicio '${Nombre}' ya está en uso por otro registro.`);
    }
    console.error('Error al actualizar tipo de servicio:', error);
    throw error;
  }
}

async function eliminarTipoServicio(id) {
  try {
    if (!id) {
      throw new Error('Se requiere el ID del tipo de servicio.');
    }
    if (isNaN(id)) {
      throw new Error('El ID debe ser un número.');
    }
    const query = `
      UPDATE "tipos_servicio" 
      SET "Activo" = FALSE 
      WHERE "ID_Tipo_Servicio" = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rowCount;
  } catch (error) {
    console.error('Error al desactivar tipo de servicio:', error);
    throw error;
  }
}

async function obtenerTipoServicioPorId(id) {
  try {
    if (!id) {
      throw new Error('Se requiere el ID del tipo de servicio.');
    }
    if (isNaN(id)) {
      throw new Error('El ID debe ser un número.');
    }
    const query = 'SELECT * FROM "tipos_servicio" WHERE "ID_Tipo_Servicio" = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error al obtener tipo de servicio por ID:', error);
    throw error;
  }
}

module.exports = {
  obtenerTiposServicioActivos,
  obtenerTodosTiposServicio,
  crearTipoServicio,
  actualizarTipoServicio,
  eliminarTipoServicio,
  obtenerTipoServicioPorId
};
