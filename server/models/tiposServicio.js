const pool = require('../db');

async function obtenerTiposServicioActivos() {
  try {
    const [rows] = await pool.query(
      'SELECT ID_Tipo_Servicio, Nombre FROM tipos_servicio WHERE Activo = TRUE ORDER BY Nombre ASC'
    );
    return rows;
  } catch (error) {
    console.error('Error al obtener tipos de servicio activos:', error);
    throw error;
  }
}

async function obtenerTodosTiposServicio() {
    try {
      const [rows] = await pool.query(
        'SELECT ID_Tipo_Servicio, Nombre, Descripcion, Activo FROM tipos_servicio ORDER BY Nombre ASC'
      );
      return rows;
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
    const [result] = await pool.query(
      'INSERT INTO tipos_servicio (Nombre, Descripcion) VALUES (?, ?)',
      [Nombre, Descripcion || null]
    );
    return result.insertId;
  } catch (error)
   { 
     if (error.code === 'ER_DUP_ENTRY') {
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
    const activoDB = (Activo === true || Activo === 1 || Activo === 'true') ? 1 : 0;

    const [result] = await pool.query(
      'UPDATE tipos_servicio SET Nombre = ?, Descripcion = ?, Activo = ? WHERE ID_Tipo_Servicio = ?',
      [Nombre, Descripcion || null, activoDB, ID_Tipo_Servicio]
    );
    return result.affectedRows;
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY') {
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
    const [result] = await pool.query(
      'UPDATE tipos_servicio SET Activo = FALSE WHERE ID_Tipo_Servicio = ?',
      [id]
    );
    return result.affectedRows;
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
        const [rows] = await pool.query(
            'SELECT * FROM tipos_servicio WHERE ID_Tipo_Servicio = ?', 
            [id]
        );
        return rows[0];
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
