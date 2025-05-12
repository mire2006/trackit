const pool = require('../db'); 

function procesarReparacionesConServicios(rows) {
    return rows.map(row => {
        let servicios = [];
        if (Array.isArray(row.ServiciosJSON) && row.ServiciosJSON.length > 0) {
            servicios = row.ServiciosJSON.filter(s => s && s.ID_Tipo_Servicio && s.Nombre);
        }
        
        const reparacionData = { ...row };
        delete reparacionData.ServiciosJSON;

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
        u.Email AS UsuarioEmail,
        tb.Marca AS BombaMarca,
        tb.Modelo AS BombaModelo,
        c.Nombre_Cliente AS NombreClienteBomba, 
        c.RUT AS RUTClienteBomba,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT('ID_Tipo_Servicio', ts_inner.ID_Tipo_Servicio, 'Nombre', ts_inner.Nombre)
            )
            FROM reparacion_servicio_detalle rsd_inner
            JOIN tipos_servicio ts_inner ON rsd_inner.FK_ID_Tipo_Servicio = ts_inner.ID_Tipo_Servicio
            WHERE rsd_inner.FK_ID_Reparacion = r.ID_Reparacion
          ),
          JSON_ARRAY() 
        ) AS ServiciosJSON
      FROM 
        Reparaciones r
      LEFT JOIN 
        Usuarios u ON r.ID_Usuario = u.ID_Usuario
      LEFT JOIN
        Bombas b ON r.ID_Bomba = b.ID_Bomba
      LEFT JOIN 
        Tipos_Bomba tb ON b.FK_ID_Tipo_Bomba = tb.ID_Tipo_Bomba
      LEFT JOIN
        Clientes c ON b.ID_Cliente = c.ID_Cliente  
      ORDER BY
        r.Fecha DESC, r.ID_Reparacion DESC;
    `;
    const [rows] = await pool.query(query);
    return procesarReparacionesConServicios(rows);
  } catch (error) {
    console.error('Error SQL en obtenerReparaciones:', error);
    throw error;
  }
}

async function obtenerReparacionPorId(id) {
  if (isNaN(id) || Number(id) <= 0) {
    throw new Error('ID de reparación debe ser un número positivo.');
  }
  try {
     const query = `
      SELECT 
        r.ID_Reparacion, r.ID_Bomba, r.Fecha, r.Detalles, r.ID_Usuario,
        u.Email AS UsuarioEmail,
        tb.Marca AS BombaMarca,
        tb.Modelo AS BombaModelo,
        c.Nombre_Cliente AS NombreClienteBomba,
        c.RUT AS RUTClienteBomba,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT('ID_Tipo_Servicio', ts_inner.ID_Tipo_Servicio, 'Nombre', ts_inner.Nombre)
            )
            FROM reparacion_servicio_detalle rsd_inner
            JOIN tipos_servicio ts_inner ON rsd_inner.FK_ID_Tipo_Servicio = ts_inner.ID_Tipo_Servicio
            WHERE rsd_inner.FK_ID_Reparacion = r.ID_Reparacion
          ),
          JSON_ARRAY()
        ) AS ServiciosJSON
      FROM 
        Reparaciones r
      LEFT JOIN 
        Usuarios u ON r.ID_Usuario = u.ID_Usuario
      LEFT JOIN
        Bombas b ON r.ID_Bomba = b.ID_Bomba
      LEFT JOIN 
        Tipos_Bomba tb ON b.FK_ID_Tipo_Bomba = tb.ID_Tipo_Bomba
      LEFT JOIN
        Clientes c ON b.ID_Cliente = c.ID_Cliente
      WHERE 
        r.ID_Reparacion = ?;
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) {
        return null;
    }
    const [reparacionProcesada] = procesarReparacionesConServicios(rows);
    return reparacionProcesada;
  } catch (error) {
    console.error('Error SQL en obtenerReparacionPorId:', error);
    throw error;
  }
}

async function crearReparacion(reparacion) {
  const { ID_Bomba, Fecha, Detalles, ID_Usuario, tiposServicioIds } = reparacion;

  if (!ID_Bomba || isNaN(ID_Bomba) || Number(ID_Bomba) <= 0) {
      throw new Error('ID_Bomba es obligatorio y debe ser un número positivo.');
  }
  if (!ID_Usuario || isNaN(ID_Usuario) || Number(ID_Usuario) <= 0) {
    throw new Error('ID_Usuario es obligatorio y debe ser un número positivo.');
  }
  if (!Fecha) {
    throw new Error('Fecha es un campo obligatorio.');
  }
  if (!Array.isArray(tiposServicioIds) || tiposServicioIds.length === 0) {
      throw new Error('Se debe seleccionar al menos un tipo de servicio.');
  }
   if (!tiposServicioIds.every(idServ => idServ && !isNaN(idServ) && Number(idServ) > 0 )) {
       throw new Error('Todos los IDs de tipo de servicio deben ser números positivos válidos.');
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

    const detalleValues = tiposServicioIds.map(tipoId => [newReparacionId, tipoId]);
    await connection.query(
      'INSERT INTO reparacion_servicio_detalle (FK_ID_Reparacion, FK_ID_Tipo_Servicio) VALUES ?',
      [detalleValues]
    );
    
    await connection.commit();
    return newReparacionId;

  } catch (error) {
    if (connection) await connection.rollback(); 
    console.error('Error al crear reparación:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        if (error.message.includes('fk_reparaciones_bombas')) {
             throw new Error('La bomba especificada no existe.');
        } else if (error.message.includes('fk_reparaciones_usuarios')) {
            throw new Error('El usuario que registra la reparación no existe.');
        } else if (error.message.includes('fk_rsd_tipos_servicio')) {
            throw new Error('Uno de los tipos de servicio seleccionados no es válido.');
        }
        throw new Error('Error de referencia: Verifique los datos de Bomba, Usuario o Tipos de Servicio.');
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function actualizarReparacion(reparacion) {
  const { ID_Reparacion, ID_Bomba, Fecha, Detalles, ID_Usuario, tiposServicioIds } = reparacion;

  if (isNaN(ID_Reparacion) || Number(ID_Reparacion) <=0 ) {
      throw new Error('ID_Reparacion es obligatorio y debe ser un número positivo.');
  }
  if (!ID_Bomba || isNaN(ID_Bomba) || Number(ID_Bomba) <= 0) {
    throw new Error('ID_Bomba es obligatorio y debe ser un número positivo.');
  }
  if (!ID_Usuario || isNaN(ID_Usuario) || Number(ID_Usuario) <= 0) {
    throw new Error('ID_Usuario es obligatorio y debe ser un número positivo.');
  }
   if (!Fecha) { 
    throw new Error('Fecha es un campo obligatorio.');
  }
   if (!Array.isArray(tiposServicioIds) || tiposServicioIds.length === 0) {
      throw new Error('Se debe seleccionar al menos un tipo de servicio.');
  }
   if (!tiposServicioIds.every(idServ => idServ && !isNaN(idServ) && Number(idServ) > 0)) {
       throw new Error('Todos los IDs de tipo de servicio deben ser números positivos válidos.');
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
        throw new Error('Reparación no encontrada para actualizar o los datos son idénticos a los existentes.');
    }

    await connection.query('DELETE FROM reparacion_servicio_detalle WHERE FK_ID_Reparacion = ?', [ID_Reparacion]);

    const detalleValues = tiposServicioIds.map(tipoId => [ID_Reparacion, tipoId]);
    await connection.query(
      'INSERT INTO reparacion_servicio_detalle (FK_ID_Reparacion, FK_ID_Tipo_Servicio) VALUES ?',
      [detalleValues]
    );
    
    await connection.commit();
    return resultUpdate.affectedRows;

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar reparación:', error);
     if (error.code === 'ER_NO_REFERENCED_ROW_2') {
         if (error.message.includes('fk_reparaciones_bombas')) {
             throw new Error('La bomba especificada no existe.');
        } else if (error.message.includes('fk_reparaciones_usuarios')) {
            throw new Error('El usuario que registra la reparación no existe.');
        } else if (error.message.includes('fk_rsd_tipos_servicio')) {
            throw new Error('Uno de los tipos de servicio seleccionados no es válido.');
        }
        throw new Error('Error de referencia: Verifique los datos de Bomba, Usuario o Tipos de Servicio.');
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function eliminarReparacion(id) {
  if (isNaN(id) || Number(id) <= 0) {
    throw new Error('ID de reparación debe ser un número positivo.');
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query('DELETE FROM reparacion_servicio_detalle WHERE FK_ID_Reparacion = ?', [id]);
    const [result] = await connection.query('DELETE FROM Reparaciones WHERE ID_Reparacion = ?', [id]);
    
    await connection.commit();
    return result.affectedRows; 
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar reparación:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function obtenerReparacionesDeBomba(bombaId) {
  if (isNaN(bombaId) || Number(bombaId) <= 0) {
    throw new Error('ID de bomba debe ser un número positivo.');
  }
  try {
     const query = `
      SELECT 
        r.ID_Reparacion, r.ID_Bomba, r.Fecha, r.Detalles, r.ID_Usuario,
        u.Email AS UsuarioEmail, 
        tb.Marca AS BombaMarca,       /* Se obtienen de la bomba, no de la reparación directamente */
        tb.Modelo AS BombaModelo,     /* Se obtienen de la bomba, no de la reparación directamente */
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT('ID_Tipo_Servicio', ts_inner.ID_Tipo_Servicio, 'Nombre', ts_inner.Nombre)
            )
            FROM reparacion_servicio_detalle rsd_inner
            JOIN tipos_servicio ts_inner ON rsd_inner.FK_ID_Tipo_Servicio = ts_inner.ID_Tipo_Servicio
            WHERE rsd_inner.FK_ID_Reparacion = r.ID_Reparacion
          ),
          JSON_ARRAY()
        ) AS ServiciosJSON
      FROM 
        Reparaciones r
      LEFT JOIN 
        Usuarios u ON r.ID_Usuario = u.ID_Usuario
      LEFT JOIN
        Bombas b_reparacion ON r.ID_Bomba = b_reparacion.ID_Bomba /* Alias para la tabla Bombas unida a Reparaciones */
      LEFT JOIN 
        Tipos_Bomba tb ON b_reparacion.FK_ID_Tipo_Bomba = tb.ID_Tipo_Bomba /* Unir Tipos_Bomba a través de la bomba de la reparación */
      WHERE 
        r.ID_Bomba = ?
      ORDER BY
        r.Fecha DESC, r.ID_Reparacion DESC;
    `;
    const [rows] = await pool.query(query, [bombaId]);
    return procesarReparacionesConServicios(rows); 
  } catch (error) {
    console.error('Error SQL en obtenerReparacionesDeBomba:', error);
    throw error;
  }
}


module.exports = {
    obtenerReparaciones,
    obtenerReparacionPorId,
    crearReparacion,
    actualizarReparacion,
    eliminarReparacion,
    obtenerReparacionesDeBomba
};
