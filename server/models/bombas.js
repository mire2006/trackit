const pool = require('../db');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

async function obtenerBombas() {
  try {
    const query = `
      SELECT 
          b."ID_Bomba", b."ID_Cliente", b."FK_ID_Tipo_Bomba", b."Circuito", b."qr_code", 
          tb."Marca", tb."Modelo",
          (SELECT c."Nombre_Cliente" FROM "clientes" c WHERE c."ID_Cliente" = b."ID_Cliente") as "Nombre_Cliente" 
      FROM 
          "bombas" b 
      JOIN 
          "tipos_bomba" tb ON b."FK_ID_Tipo_Bomba" = tb."ID_Tipo_Bomba"
      ORDER BY b."ID_Bomba" ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener bombas:', error);
    throw error;
  }
}

async function obtenerBombaPorId(ID_Bomba) {
  try {
    if (isNaN(ID_Bomba) || ID_Bomba <= 0) {
      throw new Error('ID_Bomba debe ser un número positivo.');
    }
    const query = `
      SELECT 
          b."ID_Bomba", b."ID_Cliente", b."FK_ID_Tipo_Bomba", b."Circuito", b."qr_code", 
          tb."Marca", tb."Modelo", tb."Descripcion_Tecnica",
          (SELECT c."Nombre_Cliente" FROM "clientes" c WHERE c."ID_Cliente" = b."ID_Cliente") as "Nombre_Cliente"
      FROM 
          "bombas" b 
      JOIN 
          "tipos_bomba" tb ON b."FK_ID_Tipo_Bomba" = tb."ID_Tipo_Bomba"
      WHERE 
          b."ID_Bomba" = $1;
    `;
    const result = await pool.query(query, [ID_Bomba]);
    return result.rows[0];
  } catch (error) {
    console.error('Error al obtener bomba por ID:', error);
    throw error;
  }
}

async function crearBomba(bomba) {
  const client = await pool.connect();
  try {
    const { ID_Cliente, FK_ID_Tipo_Bomba, Circuito } = bomba;

    if (!ID_Cliente || !FK_ID_Tipo_Bomba || !Circuito) {
      throw new Error('ID_Cliente, FK_ID_Tipo_Bomba y Circuito son obligatorios.');
    }
    if (isNaN(ID_Cliente) || ID_Cliente <= 0 || isNaN(FK_ID_Tipo_Bomba) || FK_ID_Tipo_Bomba <= 0) {
      throw new Error('ID_Cliente y FK_ID_Tipo_Bomba deben ser números positivos.');
    }
    if (Circuito.length > 150) {
      throw new Error('El campo Circuito no debe exceder los 150 caracteres.');
    }

    await client.query('BEGIN');

    const insertBombaQuery = `
      INSERT INTO "bombas" ("ID_Cliente", "FK_ID_Tipo_Bomba", "Circuito") 
      VALUES ($1, $2, $3)
      RETURNING "ID_Bomba"
    `;
    const insertBombaValues = [ID_Cliente, FK_ID_Tipo_Bomba, Circuito];
    const insertResult = await client.query(insertBombaQuery, insertBombaValues);
    
    if (!insertResult.rows || insertResult.rows.length === 0) {
        throw new Error('No se pudo crear la bomba o obtener el ID.');
    }
    const bombaId = insertResult.rows[0]['ID_Bomba'];

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const qrData = `${frontendUrl}/reparaciones/bomba/${bombaId}`;
    
    const qrDirectory = path.join(__dirname, '..', 'public', 'qrcodes'); 
    const qrImagePath = path.join(qrDirectory, `bomba_${bombaId}.png`);
    const qrDbPath = `/qrcodes/bomba_${bombaId}.png`; 

    try {
      await fs.mkdir(qrDirectory, { recursive: true });
      await QRCode.toFile(qrImagePath, qrData);
      console.log(`Código QR generado para bomba ${bombaId} en ${qrImagePath}`);
    } catch (qrError) {
      console.error('Error al generar o guardar el código QR:', qrError);
      await client.query('ROLLBACK');
      throw qrError;
    }

    const updateQrQuery = 'UPDATE "bombas" SET "qr_code" = $1 WHERE "ID_Bomba" = $2';
    await client.query(updateQrQuery, [qrDbPath, bombaId]);

    await client.query('COMMIT');
    return bombaId;

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error al intentar rollback:', rollbackError);
      }
    }
    if (error.code === '23503') {
      throw new Error('El Cliente o el Tipo de Bomba especificado no existe.');
    }
    console.error('Error al crear bomba:', error);
    throw error;
  } finally {
    if (client) {
      client.release(); 
    }
  }
}

async function actualizarBomba(bomba) {
  try {
    const { ID_Bomba, ID_Cliente, FK_ID_Tipo_Bomba, Circuito } = bomba;

    if (!ID_Bomba || !ID_Cliente || !FK_ID_Tipo_Bomba || !Circuito) {
      throw new Error('ID_Bomba, ID_Cliente, FK_ID_Tipo_Bomba y Circuito son obligatorios.');
    }
    if (isNaN(ID_Bomba) || ID_Bomba <= 0 || isNaN(ID_Cliente) || ID_Cliente <= 0 || isNaN(FK_ID_Tipo_Bomba) || FK_ID_Tipo_Bomba <= 0) {
      throw new Error('ID_Bomba, ID_Cliente y FK_ID_Tipo_Bomba deben ser números positivos.');
    }
    if (Circuito.length > 150) {
      throw new Error('El campo Circuito no debe exceder los 150 caracteres.');
    }

    const query = `
      UPDATE "bombas" 
      SET "ID_Cliente" = $1, "FK_ID_Tipo_Bomba" = $2, "Circuito" = $3 
      WHERE "ID_Bomba" = $4
    `;
    const values = [ID_Cliente, FK_ID_Tipo_Bomba, Circuito, ID_Bomba];
    const result = await pool.query(query, values);
    return result.rowCount;
  } catch (error) {
    if (error.code === '23503') {
      throw new Error('El Cliente o el Tipo de Bomba especificado no existe.');
    }
    console.error('Error al actualizar bomba:', error);
    throw error;
  }
}

async function eliminarBomba(ID_Bomba) {
  try {
    if (isNaN(ID_Bomba) || ID_Bomba <= 0) {
      throw new Error('ID_Bomba debe ser un número positivo.');
    }

    const bombaExistente = await obtenerBombaPorId(ID_Bomba);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const deleteQuery = 'DELETE FROM "bombas" WHERE "ID_Bomba" = $1';
        const result = await client.query(deleteQuery, [ID_Bomba]);

        if (result.rowCount > 0 && bombaExistente && bombaExistente.qr_code) {
            const qrPathAbsoluto = path.join(__dirname, '..', 'public', bombaExistente.qr_code);
            try {
                await fs.unlink(qrPathAbsoluto);
                console.log(`Archivo QR ${qrPathAbsoluto} eliminado.`);
            } catch (fsError) {
                console.warn(`No se pudo eliminar el archivo QR ${bombaExistente.qr_code} para bomba ${ID_Bomba}:`, fsError.message);
            }
        }
        
        await client.query('COMMIT');
        return result.rowCount;

    } catch (dbError) {
        await client.query('ROLLBACK');
        if (dbError.code === '23503') {
            throw new Error('No se puede eliminar la bomba porque tiene reparaciones asociadas.');
        }
        console.error('Error al eliminar bomba (DB):', dbError);
        throw dbError;
    } finally {
        client.release();
    }

  } catch (error) {
    console.error('Error general al eliminar bomba:', error);
    throw error;
  }
}

async function obtenerBombasPorCliente(ID_Cliente) {
  try {
    if (isNaN(ID_Cliente) || ID_Cliente <= 0) {
      throw new Error('ID_Cliente debe ser un número positivo.');
    }

    const query = `
      SELECT 
          b."ID_Bomba", b."ID_Cliente", b."FK_ID_Tipo_Bomba", b."Circuito", b."qr_code", 
          tb."Marca", tb."Modelo" 
      FROM 
          "bombas" b 
      JOIN 
          "tipos_bomba" tb ON b."FK_ID_Tipo_Bomba" = tb."ID_Tipo_Bomba"
      WHERE 
          b."ID_Cliente" = $1
      ORDER BY b."ID_Bomba" ASC;
    `;
    const result = await pool.query(query, [ID_Cliente]);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener bombas del cliente:', error);
    throw error;
  }
}

module.exports = {
  obtenerBombas,
  crearBomba,
  actualizarBomba,
  eliminarBomba,
  obtenerBombaPorId,
  obtenerBombasPorCliente
};
