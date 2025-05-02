const pool = require('../db'); 

function procesarReparacionesConServicios(rows) {
    return rows.map(row => {
        let servicios = [];
        try {
            if (row.ServiciosJSON && row.ServiciosJSON !== '') {
                 servicios = JSON.parse(row.ServiciosJSON);
                 if (servicios === null) servicios = []; 
            }
        } catch (e) {
            console.error(`Error parseando ServiciosJSON para reparacion ID ${row.ID_Reparacion}:`, e, row.ServiciosJSON);
            servicios = [];
        }
        
        const { ServiciosJSON, ...reparacionData } = row;
        return {
            ...reparacionData,
            Servicios: servicios
        };
    });
}


async function obtenerReparaciones() {
  try {
    const query = `
      SELECT 
        r.ID_Reparacion, r.ID_Bomba, r.Fecha, r.Detalles, r.ID_Usuario,
        (SELECT u.Email FROM usuarios u WHERE u.ID_Usuario = r.ID_Usuario) as UsuarioEmail, -- Opcional: obtener email del usuario
        (SELECT b.Modelo FROM bombas b WHERE b.ID_Bomba = r.ID_Bomba) as BombaModelo,     -- Opcional: obtener modelo de bomba
        JSON_ARRAYAGG(
          IF(ts.ID_Tipo_Servicio IS NULL, NULL, -- Evita objeto JSON vacío si no hay match
            JSON_OBJECT('ID_Tipo_Servicio', ts.ID_Tipo_Servicio, 'Nombre', ts.Nombre)
          )
        ) as ServiciosJSON 
      FROM 
        Reparaciones r
      LEFT JOIN 
        reparacion_servicio_detalle rsd ON r.ID_Reparacion = rsd.FK_ID_Reparacion
      LEFT JOIN 
        tipos_servicio ts ON rsd.FK_ID_Tipo_Servicio = ts.ID_Tipo_Servicio
      GROUP BY 
        r.ID_Reparacion
      ORDER BY
        r.Fecha DESC; 
    `;
    const [rows] = await pool.query(query);
    return procesarReparacionesConServicios(rows);
  } catch (error) {
    console.error('Error al obtener reparaciones:', error);
    throw error;
  }
}

async function obtenerReparacionPorId(id) {
  if (isNaN(id)) {
    throw new Error('ID de reparación debe ser un número.');
  }

  try {
     const query = `
      SELECT 
        r.ID_Reparacion, r.ID_Bomba, r.Fecha, r.Detalles, r.ID_Usuario,
        (SELECT u.Email FROM usuarios u WHERE u.ID_Usuario = r.ID_Usuario) as UsuarioEmail, 
        (SELECT b.Modelo FROM bombas b WHERE b.ID_Bomba = r.ID_Bomba) as BombaModelo,
        JSON_ARRAYAGG(
          IF(ts.ID_Tipo_Servicio IS NULL, NULL,
            JSON_OBJECT('ID_Tipo_Servicio', ts.ID_Tipo_Servicio, 'Nombre', ts.Nombre)
          )
        ) as ServiciosJSON 
      FROM 
        Reparaciones r
      LEFT JOIN 
        reparacion_servicio_detalle rsd ON r.ID_Reparacion = rsd.FK_ID_Reparacion
      LEFT JOIN 
        tipos_servicio ts ON rsd.FK_ID_Tipo_Servicio = ts.ID_Tipo_Servicio
      WHERE 
        r.ID_Reparacion = ?
      GROUP BY 
        r.ID_Reparacion; 
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) {
        return null;
    }
    const [reparacionProcesada] = procesarReparacionesConServicios(rows);
    return reparacionProcesada;
  } catch (error) {
    console.error('Error al obtener reparación por ID:', error);
    throw error;
  }
}

async function crearReparacion(reparacion) {
  const { ID_Bomba, Fecha, Detalles, ID_Usuario, tiposServicioIds } = reparacion;

  if (isNaN(ID_Bomba) || isNaN(ID_Usuario)) {
    throw new Error('ID_Bomba e ID_Usuario deben ser números.');
  }
  if (!Fecha || !Detalles) {
    throw new Error('Fecha y Detalles son campos obligatorios.');
  }
  if (!Array.isArray(tiposServicioIds) || tiposServicioIds.length === 0) {
      throw new Error('Se debe seleccionar al menos un tipo de servicio.');
  }
   if (!tiposServicioIds.every(id => !isNaN(id))) {
       throw new Error('Todos los IDs de tipo de servicio deben ser números.');
   }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [resultReparacion] = await connection.query(
      'INSERT INTO Reparaciones (ID_Bomba, Fecha, Detalles, ID_Usuario) VALUES (?, ?, ?, ?)',
      [ID_Bomba, Fecha, Detalles || null, ID_Usuario]
    );
    const newReparacionId = resultReparacion.insertId;

    if (tiposServicioIds && tiposServicioIds.length > 0) {
      const detalleValues = tiposServicioIds.map(tipoId => [newReparacionId, tipoId]);
      
      await connection.query(
        'INSERT INTO reparacion_servicio_detalle (FK_ID_Reparacion, FK_ID_Tipo_Servicio) VALUES ?',
        [detalleValues]
      );
    }

    await connection.commit();
    
    return newReparacionId;

  } catch (error) {
    if (connection) await connection.rollback(); 
    console.error('Error al crear reparación (transacción revertida):', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new Error('Uno de los tipos de servicio seleccionados no es válido.');
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function actualizarReparacion(reparacion) {
  const { ID_Reparacion, ID_Bomba, Fecha, Detalles, ID_Usuario, tiposServicioIds } = reparacion;

  if (isNaN(ID_Reparacion) || isNaN(ID_Bomba) || isNaN(ID_Usuario)) {
    throw new Error('ID_Reparacion, ID_Bomba e ID_Usuario deben ser números.');
  }
   if (!Fecha || !Detalles) { 
    throw new Error('Fecha y Detalles son campos obligatorios.');
  }
   if (!Array.isArray(tiposServicioIds) || tiposServicioIds.length === 0) {
      throw new Error('Se debe seleccionar al menos un tipo de servicio.');
  }
   if (!tiposServicioIds.every(id => !isNaN(id))) {
       throw new Error('Todos los IDs de tipo de servicio deben ser números.');
   }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [resultUpdate] = await connection.query(
      'UPDATE Reparaciones SET ID_Bomba = ?, Fecha = ?, Detalles = ?, ID_Usuario = ? WHERE ID_Reparacion = ?',
      [ID_Bomba, Fecha, Detalles || null, ID_Usuario, ID_Reparacion]
    );

    if (resultUpdate.affectedRows === 0) {
        await connection.rollback();
        if (connection) connection.release();
        return 0;
    }

    await connection.query('DELETE FROM reparacion_servicio_detalle WHERE FK_ID_Reparacion = ?', [ID_Reparacion]);

     if (tiposServicioIds && tiposServicioIds.length > 0) {
        const detalleValues = tiposServicioIds.map(tipoId => [ID_Reparacion, tipoId]);
        await connection.query(
          'INSERT INTO reparacion_servicio_detalle (FK_ID_Reparacion, FK_ID_Tipo_Servicio) VALUES ?',
          [detalleValues]
        );
    }

    await connection.commit();
    
    return resultUpdate.affectedRows;

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar reparación (transacción revertida):', error);
     if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new Error('Uno de los tipos de servicio seleccionados no es válido.');
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function eliminarReparacion(id) {
  if (isNaN(id)) {
    throw new Error('ID de reparación debe ser un número.');
  }
  try {
    const [result] = await pool.query('DELETE FROM Reparaciones WHERE ID_Reparacion = ?', [id]);
    return result.affectedRows; 
  } catch (error) {
    console.error('Error al eliminar reparación:', error);
    throw error;
  }
}

async function obtenerUltimaReparacionDeBomba(bombaId) {
  if (isNaN(bombaId) || bombaId <= 0) {
    throw new Error('ID de bomba debe ser un número positivo.');
  }

  try {
     const query = `
      SELECT 
        r.ID_Reparacion, r.ID_Bomba, r.Fecha, r.Detalles, r.ID_Usuario,
        (SELECT u.Email FROM usuarios u WHERE u.ID_Usuario = r.ID_Usuario) as UsuarioEmail, 
        (SELECT b.Modelo FROM bombas b WHERE b.ID_Bomba = r.ID_Bomba) as BombaModelo,
        JSON_ARRAYAGG(
          IF(ts.ID_Tipo_Servicio IS NULL, NULL,
            JSON_OBJECT('ID_Tipo_Servicio', ts.ID_Tipo_Servicio, 'Nombre', ts.Nombre)
          )
        ) as ServiciosJSON 
      FROM 
        Reparaciones r
      LEFT JOIN 
        reparacion_servicio_detalle rsd ON r.ID_Reparacion = rsd.FK_ID_Reparacion
      LEFT JOIN 
        tipos_servicio ts ON rsd.FK_ID_Tipo_Servicio = ts.ID_Tipo_Servicio
      WHERE 
        r.ID_Bomba = ?  -- Filtro por bomba
      GROUP BY 
        r.ID_Reparacion
      ORDER BY
        r.Fecha DESC -- Ordenar para obtener la última
      LIMIT 1;        -- Tomar solo la última
    `;
    const [rows] = await pool.query(query, [bombaId]);
     if (rows.length === 0) {
        return null;
    }
    const [reparacionProcesada] = procesarReparacionesConServicios(rows);
    return reparacionProcesada;
  } catch (error) {
    console.error('Error al obtener la última reparación de la bomba:', error);
    throw error;
  }
}

module.exports = {
    obtenerReparaciones,
    obtenerReparacionPorId,
    crearReparacion,
    actualizarReparacion,
    eliminarReparacion,
    obtenerUltimaReparacionDeBomba
};
