const pool = require('../db');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

async function obtenerBombas() {
  try {
    const query = `
      SELECT 
          b.ID_Bomba, b.ID_Cliente, b.FK_ID_Tipo_Bomba, b.Circuito, b.qr_code, 
          tb.Marca, tb.Modelo,
          (SELECT c.Nombre_Cliente FROM Clientes c WHERE c.ID_Cliente = b.ID_Cliente) as Nombre_Cliente 
      FROM 
          Bombas b 
      JOIN 
          Tipos_Bomba tb ON b.FK_ID_Tipo_Bomba = tb.ID_Tipo_Bomba
      ORDER BY b.ID_Bomba ASC;
    `;
    const [rows] = await pool.query(query);
    return rows;
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
          b.ID_Bomba, b.ID_Cliente, b.FK_ID_Tipo_Bomba, b.Circuito, b.qr_code, 
          tb.Marca, tb.Modelo, tb.Descripcion_Tecnica,
          (SELECT c.Nombre_Cliente FROM Clientes c WHERE c.ID_Cliente = b.ID_Cliente) as Nombre_Cliente
      FROM 
          Bombas b 
      JOIN 
          Tipos_Bomba tb ON b.FK_ID_Tipo_Bomba = tb.ID_Tipo_Bomba
      WHERE 
          b.ID_Bomba = ?;
    `;
    const [rows] = await pool.query(query, [ID_Bomba]);
    return rows[0];
  } catch (error) {
    console.error('Error al obtener bomba por ID:', error);
    throw error;
  }
}


async function crearBomba(bomba) {
  let connection;
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

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO Bombas (ID_Cliente, FK_ID_Tipo_Bomba, Circuito) VALUES (?, ?, ?)',
      [ID_Cliente, FK_ID_Tipo_Bomba, Circuito]
    );
    const bombaId = result.insertId;

    const qrData = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reparaciones/bomba/${bombaId}`;
    const qrDirectory = path.join(__dirname, '../public/qrcodes');
    const qrImagePath = path.join(qrDirectory, `bomba_${bombaId}.png`);
    const qrDbPath = `/qrcodes/bomba_${bombaId}.png`;

    try {
      await fs.mkdir(qrDirectory, { recursive: true });
      await QRCode.toFile(qrImagePath, qrData);
    } catch (qrError) {
      console.error('Error al generar o guardar el código QR:', qrError);
      await connection.rollback();
      throw qrError;
    }

    await connection.query(
        'UPDATE Bombas SET qr_code = ? WHERE ID_Bomba = ?', 
        [qrDbPath, bombaId]
        );

    await connection.commit();
    return bombaId;

  } catch (error) {
    if (connection) await connection.rollback(); 

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
         throw new Error('El Cliente o el Tipo de Bomba especificado no existe.');
    }
     if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('qr_code')) {
         throw new Error('Error al generar un código QR único.');
     }

    console.error('Error al crear bomba:', error);
    throw error;
  } finally {
      if (connection) connection.release();
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

    const [result] = await pool.query(
      'UPDATE Bombas SET ID_Cliente = ?, FK_ID_Tipo_Bomba = ?, Circuito = ? WHERE ID_Bomba = ?',
      [ID_Cliente, FK_ID_Tipo_Bomba, Circuito, ID_Bomba]
    );
    return result.affectedRows;
  } catch (error) {
     if (error.code === 'ER_NO_REFERENCED_ROW_2') {
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

     try {
       const bomba = await obtenerBombaPorId(ID_Bomba);
       if (bomba && bomba.qr_code) {
           const qrPathAbsoluto = path.join(__dirname, '../public', bomba.qr_code);
            await fs.unlink(qrPathAbsoluto);
            console.log(`Archivo QR ${qrPathAbsoluto} eliminado.`);
       }
     } catch(fsError) {
         console.warn(`No se pudo eliminar el archivo QR para bomba ${ID_Bomba}:`, fsError.message);
     }


    const [result] = await pool.query('DELETE FROM Bombas WHERE ID_Bomba = ?', [ID_Bomba]);
    return result.affectedRows;
  } catch (error) {
     if (error.code === 'ER_ROW_IS_REFERENCED_2') { 
        throw new Error('No se puede eliminar la bomba porque tiene reparaciones asociadas.');
    }
    console.error('Error al eliminar bomba:', error);
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
          b.ID_Bomba, b.ID_Cliente, b.FK_ID_Tipo_Bomba, b.Circuito, b.qr_code, 
          tb.Marca, tb.Modelo 
      FROM 
          Bombas b 
      JOIN 
          Tipos_Bomba tb ON b.FK_ID_Tipo_Bomba = tb.ID_Tipo_Bomba
      WHERE 
          b.ID_Cliente = ?
      ORDER BY b.ID_Bomba ASC;
    `;
    const [rows] = await pool.query(query, [ID_Cliente]);
    return rows;
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
