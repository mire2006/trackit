const pool = require('../db');

function procesarReparacionesConServicios(rows) {
  return rows.map(row => {
    let servicios = [];
    if (Array.isArray(row.ServiciosJSON) && row.ServiciosJSON.length > 0) {
      servicios = row.ServiciosJSON.filter(s => s && typeof s['ID_Tipo_Servicio'] !== 'undefined' && typeof s['Nombre'] !== 'undefined');
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
        r."ID_Reparacion", r."ID_Bomba", r."Fecha", r."Detalles", r."ID_Usuario",
        u."Email" AS "UsuarioEmail",
        tb."Marca" AS "BombaMarca",
        tb."Modelo" AS "BombaModelo",
        c."Nombre_Cliente" AS "NombreClienteBomba", 
        c."RUT" AS "RUTClienteBomba",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('ID_Tipo_Servicio', ts_inner."ID_Tipo_Servicio", 'Nombre', ts_inner."Nombre")
            )
            FROM "reparacion_servicio_detalle" rsd_inner
            JOIN "tipos_servicio" ts_inner ON rsd_inner."FK_ID_Tipo_Servicio" = ts_inner."ID_Tipo_Servicio"
            WHERE rsd_inner."FK_ID_Reparacion" = r."ID_Reparacion"
          ),
          '[]'::json 
        ) AS "ServiciosJSON"
      FROM 
        "reparaciones" r
      LEFT JOIN 
        "usuarios" u ON r."ID_Usuario" = u."ID_Usuario"
      LEFT JOIN
        "bombas" b ON r."ID_Bomba" = b."ID_Bomba"
      LEFT JOIN 
        "tipos_bomba" tb ON b."FK_ID_Tipo_Bomba" = tb."ID_Tipo_Bomba"
      LEFT JOIN
        "clientes" c ON b."ID_Cliente" = c."ID_Cliente"  
      ORDER BY
        r."Fecha" DESC, r."ID_Reparacion" DESC;
    `;
    const result = await pool.query(query);
    return procesarReparacionesConServicios(result.rows);
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
        r."ID_Reparacion", r."ID_Bomba", r."Fecha", r."Detalles", r."ID_Usuario",
        u."Email" AS "UsuarioEmail",
        tb."Marca" AS "BombaMarca",
        tb."Modelo" AS "BombaModelo",
        c."Nombre_Cliente" AS "NombreClienteBomba",
        c."RUT" AS "RUTClienteBomba",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('ID_Tipo_Servicio', ts_inner."ID_Tipo_Servicio", 'Nombre', ts_inner."Nombre")
            )
            FROM "reparacion_servicio_detalle" rsd_inner
            JOIN "tipos_servicio" ts_inner ON rsd_inner."FK_ID_Tipo_Servicio" = ts_inner."ID_Tipo_Servicio"
            WHERE rsd_inner."FK_ID_Reparacion" = r."ID_Reparacion"
          ),
          '[]'::json
        ) AS "ServiciosJSON"
      FROM 
        "reparaciones" r
      LEFT JOIN 
        "usuarios" u ON r."ID_Usuario" = u."ID_Usuario"
      LEFT JOIN
        "bombas" b ON r."ID_Bomba" = b."ID_Bomba"
      LEFT JOIN 
        "tipos_bomba" tb ON b."FK_ID_Tipo_Bomba" = tb."ID_Tipo_Bomba"
      LEFT JOIN
        "clientes" c ON b."ID_Cliente" = c."ID_Cliente"
      WHERE 
        r."ID_Reparacion" = $1;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    const [reparacionProcesada] = procesarReparacionesConServicios(result.rows); 
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
  if (!tiposServicioIds.every(idServ => idServ && !isNaN(idServ) && Number(idServ) > 0)) {
    throw new Error('Todos los IDs de tipo de servicio deben ser números positivos válidos.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertReparacionQuery = `
      INSERT INTO "reparaciones" ("ID_Bomba", "Fecha", "Detalles", "ID_Usuario") 
      VALUES ($1, $2, $3, $4)
      RETURNING "ID_Reparacion"
    `;
    const reparacionValues = [ID_Bomba, Fecha, Detalles || null, ID_Usuario];
    const resultReparacion = await client.query(insertReparacionQuery, reparacionValues);
    
    if (!resultReparacion.rows || resultReparacion.rows.length === 0) {
        throw new Error('No se pudo crear la reparación u obtener el ID.');
    }
    const newReparacionId = resultReparacion.rows[0]['ID_Reparacion'];

    let placeholderIndex = 1;
    const detallePlaceholders = tiposServicioIds.map(() => `($${placeholderIndex++}, $${placeholderIndex++})`).join(',');
    const detalleValuesFlat = tiposServicioIds.reduce((acc, tipoId) => {
      acc.push(newReparacionId, tipoId);
      return acc;
    }, []);

    const insertDetalleQuery = `
      INSERT INTO "reparacion_servicio_detalle" ("FK_ID_Reparacion", "FK_ID_Tipo_Servicio") 
      VALUES ${detallePlaceholders}
    `;
    await client.query(insertDetalleQuery, detalleValuesFlat);

    await client.query('COMMIT');
    return newReparacionId;

  } catch (error) {
    if (client) {
        try { await client.query('ROLLBACK'); } catch (e) { console.error('Error en rollback', e); }
    }
    console.error('Error al crear reparación:', error);
    if (error.code === '23503') { 
      throw new Error('Error de referencia: Verifique los datos de Bomba, Usuario o Tipos de Servicio.');
    }
    throw error;
  } finally {
    if (client) client.release();
  }
}

async function actualizarReparacion(reparacion) {
  const { ID_Reparacion, ID_Bomba, Fecha, Detalles, ID_Usuario, tiposServicioIds } = reparacion;

  if (isNaN(ID_Reparacion) || Number(ID_Reparacion) <= 0) {
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateReparacionQuery = `
      UPDATE "reparaciones" 
      SET "ID_Bomba" = $1, "Fecha" = $2, "Detalles" = $3, "ID_Usuario" = $4 
      WHERE "ID_Reparacion" = $5
    `;
    const reparacionValues = [ID_Bomba, Fecha, Detalles || null, ID_Usuario, ID_Reparacion];
    const resultUpdate = await client.query(updateReparacionQuery, reparacionValues);

    if (resultUpdate.rowCount === 0) {
      throw new Error('Reparación no encontrada para actualizar o los datos son idénticos a los existentes.');
    }

    const deleteDetallesQuery = 'DELETE FROM "reparacion_servicio_detalle" WHERE "FK_ID_Reparacion" = $1';
    await client.query(deleteDetallesQuery, [ID_Reparacion]);

    let placeholderIndex = 1;
    const detallePlaceholders = tiposServicioIds.map(() => `($${placeholderIndex++}, $${placeholderIndex++})`).join(',');
    const detalleValuesFlat = tiposServicioIds.reduce((acc, tipoId) => {
      acc.push(ID_Reparacion, tipoId);
      return acc;
    }, []);
    
    const insertDetalleQuery = `
      INSERT INTO "reparacion_servicio_detalle" ("FK_ID_Reparacion", "FK_ID_Tipo_Servicio") 
      VALUES ${detallePlaceholders}
    `;
    await client.query(insertDetalleQuery, detalleValuesFlat);

    await client.query('COMMIT');
    return resultUpdate.rowCount;

  } catch (error) {
    if (client) {
        try { await client.query('ROLLBACK'); } catch (e) { console.error('Error en rollback', e); }
    }
    console.error('Error al actualizar reparación:', error);
    if (error.code === '23503') { 
      throw new Error('Error de referencia: Verifique los datos de Bomba, Usuario o Tipos de Servicio.');
    }
    throw error;
  } finally {
    if (client) client.release();
  }
}

async function eliminarReparacion(id) {
  if (isNaN(id) || Number(id) <= 0) {
    throw new Error('ID de reparación debe ser un número positivo.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deleteReparacionQuery = 'DELETE FROM "reparaciones" WHERE "ID_Reparacion" = $1';
    const result = await client.query(deleteReparacionQuery, [id]);

    await client.query('COMMIT');
    return result.rowCount;
  } catch (error) {
    if (client) {
        try { await client.query('ROLLBACK'); } catch (e) { console.error('Error en rollback', e); }
    }
    console.error('Error al eliminar reparación:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

async function obtenerReparacionesDeBomba(bombaId) {
  if (isNaN(bombaId) || Number(bombaId) <= 0) {
    throw new Error('ID de bomba debe ser un número positivo.');
  }
  try {
    const query = `
      SELECT 
        r."ID_Reparacion", r."ID_Bomba", r."Fecha", r."Detalles", r."ID_Usuario",
        u."Email" AS "UsuarioEmail", 
        tb."Marca" AS "BombaMarca",
        tb."Modelo" AS "BombaModelo",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('ID_Tipo_Servicio', ts_inner."ID_Tipo_Servicio", 'Nombre', ts_inner."Nombre")
            )
            FROM "reparacion_servicio_detalle" rsd_inner
            JOIN "tipos_servicio" ts_inner ON rsd_inner."FK_ID_Tipo_Servicio" = ts_inner."ID_Tipo_Servicio"
            WHERE rsd_inner."FK_ID_Reparacion" = r."ID_Reparacion"
          ),
          '[]'::json
        ) AS "ServiciosJSON"
      FROM 
        "reparaciones" r
      LEFT JOIN 
        "usuarios" u ON r."ID_Usuario" = u."ID_Usuario"
      LEFT JOIN
        "bombas" b_reparacion ON r."ID_Bomba" = b_reparacion."ID_Bomba"
      LEFT JOIN 
        "tipos_bomba" tb ON b_reparacion."FK_ID_Tipo_Bomba" = tb."ID_Tipo_Bomba"
      WHERE 
        r."ID_Bomba" = $1
      ORDER BY
        r."Fecha" DESC, r."ID_Reparacion" DESC;
    `;
    const result = await pool.query(query, [bombaId]);
    return procesarReparacionesConServicios(result.rows);
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
