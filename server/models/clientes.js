const pool = require('../db');

async function obtenerClientes() {
  try {
    const [rows] = await pool.query('SELECT * FROM Clientes');
    return rows;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
}

async function crearCliente(cliente) {
  try {
    if (!cliente.ID_Cliente || !cliente.nombre || !cliente.direccion || !cliente.contacto) {
      throw new Error('Faltan datos obligatorios');
    }

    const { ID_Cliente, nombre, direccion, contacto } = cliente;

    if (typeof ID_Cliente !== 'number' || typeof nombre !== 'string' || typeof direccion !== 'string' || typeof contacto !== 'string') {
      throw new Error('Tipos de datos incorrectos');
    }

    const [result] = await pool.query(
      'INSERT INTO Clientes (ID_Cliente, nombre, direccion, contacto) VALUES (?, ?, ?, ?)',
      [ID_Cliente, nombre, direccion, contacto]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
}

async function actualizarCliente(cliente) {
  try {
    if (!cliente.ID_Cliente || !cliente.nombre || !cliente.direccion || !cliente.contacto) {
      throw new Error('Faltan datos obligatorios');
    }

    const { ID_Cliente, nombre, direccion, contacto } = cliente;

    if (typeof ID_Cliente !== 'number' || typeof nombre !== 'string' || typeof direccion !== 'string' || typeof contacto !== 'string') {
      throw new Error('Tipos de datos incorrectos');
    }

    const [result] = await pool.query(
      'UPDATE Clientes SET nombre = ?, direccion = ?, contacto = ? WHERE ID_Cliente = ?',
      [nombre, direccion, contacto, ID_Cliente]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
}

async function eliminarCliente(ID_Cliente) {
  try {
    if (!ID_Cliente) {
      throw new Error('ID_Cliente es obligatorio');
    }

    if (typeof ID_Cliente !== 'number') {
      throw new Error('ID_Cliente debe ser un número');
    }

    const [result] = await pool.query('DELETE FROM Clientes WHERE ID_Cliente = ?', [ID_Cliente]);
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    throw error;
  }
}

module.exports = {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};
