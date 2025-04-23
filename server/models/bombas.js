const pool = require('../db');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

async function obtenerBombas() {
  try {
    const [rows] = await pool.query('SELECT * FROM Bombas');
    return rows;
  } catch (error) {
    console.error('Error al obtener bombas:', error);
    throw error;
  }
}

async function crearBomba(bomba) {
  try {
    const { ID_Cliente, Marca, Modelo, Circuito } = bomba;

    if (!ID_Cliente || !Marca || !Modelo || !Circuito) {
      throw new Error('Todos los campos son obligatorios.');
    }

    if (typeof ID_Cliente !== 'number' || ID_Cliente <= 0) {
      throw new Error('ID_Cliente debe ser un número.');
    }

    if (Marca.length > 255 || Modelo.length > 255 || Circuito.length > 255) {
      throw new Error('Los campos Marca, Modelo y Circuito no deben exceder los 255 caracteres.');
    }

    const [result] = await pool.query(
      'INSERT INTO Bombas (ID_Cliente, Marca, Modelo, Circuito) VALUES (?, ?, ?, ?)',
      [ID_Cliente, Marca, Modelo, Circuito]
    );

    const bombaId = result.insertId;

    const qrData = `http://localhost:8080/reparaciones/${bombaId}`;
    const qrImagePath = path.join(__dirname, `../public/qrcodes/bomba_${bombaId}.png`);

    try {
      await fs.mkdir(path.join(__dirname, '../public/qrcodes'), { recursive: true });
      await QRCode.toFile(qrImagePath, qrData);
    } catch (qrError) {
      console.error('Error al generar o guardar el código QR:', qrError);
      throw qrError;
    }


    await pool.query('UPDATE Bombas SET qr_code = ? WHERE ID_Bomba = ?', [`/qrcodes/bomba_${bombaId}.png`, bombaId]);

    return bombaId;
  } catch (error) {
    console.error('Error al crear bomba:', error);
    throw error;
  }
}

async function actualizarBomba(bomba) {
  try {
    const { ID_Bomba, ID_Cliente, Marca, Modelo, Circuito } = bomba;

    if (!ID_Bomba || !ID_Cliente || !Marca || !Modelo || !Circuito) {
      throw new Error('Todos los campos son obligatorios.');
    }

    if (typeof ID_Bomba !== 'number' || ID_Bomba <= 0 || typeof ID_Cliente !== 'number' || ID_Cliente <= 0) {
      throw new Error('ID_Bomba e ID_Cliente deben ser números.');
    }

    if (Marca.length > 255 || Modelo.length > 255 || Circuito.length > 255) {
      throw new Error('Los campos Marca, Modelo y Circuito no deben exceder los 255 caracteres.');
    }

    const [result] = await pool.query(
      'UPDATE Bombas SET ID_Cliente = ?, Marca = ?, Modelo = ?, Circuito = ? WHERE ID_Bomba = ?',
      [ID_Cliente, Marca, Modelo, Circuito, ID_Bomba]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error al actualizar bomba:', error);
    throw error;
  }
}

async function eliminarBomba(ID_Bomba) {
  try {
    if (typeof ID_Bomba !== 'number' || ID_Bomba <= 0) {
      throw new Error('ID_Bomba debe ser un número positivo.');
    }

    const [result] = await pool.query('DELETE FROM Bombas WHERE ID_Bomba = ?', [ID_Bomba]);
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar bomba:', error);
    throw error;
  }
}

async function obtenerBombaPorId(ID_Bomba) {
  try {
    if (typeof ID_Bomba !== 'number' || ID_Bomba <= 0) {
      throw new Error('ID_Bomba debe ser un número.');
    }

    const [rows] = await pool.query('SELECT * FROM Bombas WHERE ID_Bomba = ?', [ID_Bomba]);
    return rows[0];
  } catch (error) {
    console.error('Error al obtener bomba:', error);
    throw error;
  }
}

async function obtenerBombasPorCliente(ID_Cliente) {
  try {
    if (typeof ID_Cliente !== 'number' || ID_Cliente <= 0) {
      throw new Error('ID_Cliente debe ser un número positivo.');
    }

    const [rows] = await pool.query('SELECT * FROM Bombas WHERE ID_Cliente = ?', [ID_Cliente]);
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
