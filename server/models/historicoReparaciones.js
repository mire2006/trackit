const pool = require('../db');

async function obtenerHistoricoReparaciones() {
  try {
    const [rows] = await pool.query('SELECT * FROM Reparaciones_Historico');
    return rows;
  } catch (error) {
    console.error('Error al obtener el historial de reparaciones:', error);
    throw error;
  }
}

async function crearHistoricoReparacion(historico) {
  try {
    if (!historico.ID_Bomba || !historico.Fecha || !historico.Detalles || !historico.ID_Usuario) {
      throw new Error('Faltan datos requeridos para crear el historial de reparación.');
    }

    if (typeof historico.ID_Bomba !== 'number' || !(historico.Fecha instanceof Date) 
      || typeof historico.Detalles !== 'string' || typeof historico.ID_Usuario !== 'number') {
      throw new Error('Tipos de datos incorrectos para el historial de reparación.');
    }

    const { ID_Bomba, Fecha, Detalles, ID_Usuario } = historico;
    const [result] = await pool.query(
      'INSERT INTO Reparaciones_Historico (ID_Bomba, Fecha, Detalles, ID_Usuario) VALUES (?, ?, ?, ?)',
      [ID_Bomba, Fecha, Detalles, ID_Usuario]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error al crear historial de reparación:', error);
    throw error;
  }
}

async function actualizarHistorico(historico) {
  try {
     if (!historico.ID_Historico || !historico.ID_Bomba || !historico.Fecha || !historico.Detalles || !historico.ID_Usuario) {
      throw new Error('Faltan datos requeridos para actualizar el historial de reparación.');
    }

      if (typeof historico.ID_Historico !== 'number' ||typeof historico.ID_Bomba !== 'number' 
        || !(historico.Fecha instanceof Date) || typeof historico.Detalles !== 'string' || typeof historico.ID_Usuario !== 'number') {
      throw new Error('Tipos de datos incorrectos para el historial de reparación.');
    }

    const { ID_Historico, ID_Bomba, Fecha, Detalles, ID_Usuario } = historico;
    const [result] = await pool.query(
      'UPDATE Reparaciones_Historico SET ID_Bomba = ?, Fecha = ?, Detalles = ?, ID_Usuario = ? WHERE ID_Historico = ?',
      [ID_Bomba, Fecha, Detalles, ID_Usuario, ID_Historico]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error al actualizar historial de reparación:', error);
    throw error;
  }
}

async function eliminarHistorico(id) {
  try {
    if (typeof id !== 'number') {
      throw new Error('El ID debe ser un número.');
    }
    const [result] = await pool.query('DELETE FROM Reparaciones_Historico WHERE ID_Historico = ?', [id]);
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar historial de reparación:', error);
    throw error;
  }
}

module.exports = {
  obtenerHistoricoReparaciones,
  crearHistoricoReparacion,
  actualizarHistorico,
  eliminarHistorico,
};
