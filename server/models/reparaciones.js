const pool = require('../db');

async function obtenerReparaciones() {
  try {
    const [rows] = await pool.query('SELECT * FROM Reparaciones');
    return rows;
  } catch (error) {
    console.error('Error al obtener reparaciones:', error);
    throw error;
  }
}

async function obtenerReparacionPorId(id) {
  if (typeof id !== 'number') {
    throw new Error('ID de reparación debe ser un número.');
  }

  try {
    const [rows] = await pool.query('SELECT * FROM Reparaciones WHERE ID_Reparacion = ?', [id]);
    return rows[0];
  } catch (error) {
    console.error('Error al obtener reparación por ID:', error);
    throw error;
  }
}

async function crearReparacion(reparacion) {
  const { ID_Bomba, Fecha, Detalles, ID_Usuario } = reparacion;

  if (typeof ID_Bomba !== 'number' || typeof ID_Usuario !== 'number') {
    throw new Error('ID_Bomba e ID_Usuario deben ser números.');
  }

  if (!Fecha || !Detalles) {
    throw new Error('Fecha y Detalles son campos obligatorios.');
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Reparaciones (ID_Bomba, Fecha, Detalles, ID_Usuario) VALUES (?, ?, ?, ?)',
      [ID_Bomba, Fecha, Detalles, ID_Usuario]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error al crear reparación:', error);
    throw error;
  }
}

async function actualizarReparacion(reparacion) {
  const { ID_Reparacion, ID_Bomba, Fecha, Detalles, ID_Usuario } = reparacion;

  if (typeof ID_Reparacion !== 'number' || typeof ID_Bomba !== 'number' || typeof ID_Usuario !== 'number') {
    throw new Error('ID_Reparacion, ID_Bomba e ID_Usuario deben ser números.');
  }

  if (!Fecha || !Detalles) {
    throw new Error('Fecha y Detalles son campos obligatorios.');
  }

  try {
    const [result] = await pool.query(
      'UPDATE Reparaciones SET ID_Bomba = ?, Fecha = ?, Detalles = ?, ID_Usuario = ? WHERE ID_Reparacion = ?',
      [ID_Bomba, Fecha, Detalles, ID_Usuario, ID_Reparacion]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error al actualizar reparación:', error);
    throw error;
  }
}

async function eliminarReparacion(id) {
  if (typeof id !== 'number') {
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
  if (typeof bombaId !== 'number' || bombaId <= 0) {
    throw new Error('ID de bomba debe ser un número positivo.');
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM Reparaciones WHERE ID_Bomba = ? ORDER BY Fecha DESC LIMIT 1',
      [bombaId]
    );
    return rows[0];
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
