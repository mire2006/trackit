const pool = require('../db');

async function obtenerClientes() {
  try {
    const [rows] = await pool.query(
      `SELECT ID_Cliente, RUT, Nombre_Cliente, Calle, Numero, Comuna, 
              Nombre_Contacto, Apellido_Paterno_Contacto, Apellido_Materno_Contacto, 
              Telefono_Contacto, Email_Contacto 
       FROM Clientes 
       ORDER BY Nombre_Cliente ASC`
      );
    return rows;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
}

async function obtenerClientePorId(idCliente) {
    try {
        if (isNaN(idCliente) || idCliente <= 0) {
            throw new Error('ID de cliente debe ser un número positivo.');
        }
        const [rows] = await pool.query(
             `SELECT ID_Cliente, RUT, Nombre_Cliente, Calle, Numero, Comuna, 
                     Nombre_Contacto, Apellido_Paterno_Contacto, Apellido_Materno_Contacto, 
                     Telefono_Contacto, Email_Contacto 
              FROM Clientes 
              WHERE ID_Cliente = ?`,
            [idCliente]
        );
        return rows[0];
    } catch (error) {
        console.error('Error al obtener cliente por ID:', error);
        throw error;
    }
}


async function crearCliente(cliente) {
  try {
    const { 
        RUT, Nombre_Cliente, Calle, Numero, Comuna, 
        Nombre_Contacto, Apellido_Paterno_Contacto, Apellido_Materno_Contacto, 
        Telefono_Contacto, Email_Contacto 
    } = cliente;

    if (!RUT || !Nombre_Cliente || !Calle || !Numero || !Comuna || !Nombre_Contacto || 
      !Apellido_Paterno_Contacto || !Telefono_Contacto || !Email_Contacto) {
      throw new Error('Faltan datos obligatorios (RUT, Nombre Cliente, Calle, Numero, Comuna, Nombre Contacto, Apellido Contacto, Teléfono Contacto, Email Contacto).');
    }

    const [result] = await pool.query(
      `INSERT INTO Clientes 
        (RUT, Nombre_Cliente, Calle, Numero, Comuna, Nombre_Contacto, 
         Apellido_Paterno_Contacto, Apellido_Materno_Contacto, Telefono_Contacto, Email_Contacto) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        RUT, Nombre_Cliente, Calle, Numero, Comuna, Nombre_Contacto, 
        Apellido_Paterno_Contacto, Apellido_Materno_Contacto || null,
        Telefono_Contacto, Email_Contacto
      ]
    );
    return result.insertId;
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('RUT')) {
         throw new Error(`El RUT '${RUT}' ya está registrado.`);
     }
    console.error('Error al crear cliente:', error);
    throw error;
  }
}

async function actualizarCliente(cliente) {
  try {
    const { 
        ID_Cliente, RUT, Nombre_Cliente, Calle, Numero, Comuna, 
        Nombre_Contacto, Apellido_Paterno_Contacto, Apellido_Materno_Contacto, 
        Telefono_Contacto, Email_Contacto 
    } = cliente;

     if (!ID_Cliente || !RUT || !Nombre_Cliente || !Calle || !Numero || !Comuna || 
      !Nombre_Contacto || !Apellido_Paterno_Contacto || !Telefono_Contacto || !Email_Contacto) {
      throw new Error('Faltan datos obligatorios (ID, RUT, Nombre Cliente, Calle, Numero, Comuna, Nombre Contacto, Apellido Contacto, Teléfono Contacto, Email Contacto).');
    }
     if (isNaN(ID_Cliente) || ID_Cliente <= 0) {
         throw new Error('ID de cliente debe ser un número positivo.');
     }

    const [result] = await pool.query(
      `UPDATE Clientes SET 
          RUT = ?, Nombre_Cliente = ?, Calle = ?, Numero = ?, Comuna = ?, 
          Nombre_Contacto = ?, Apellido_Paterno_Contacto = ?, Apellido_Materno_Contacto = ?, 
          Telefono_Contacto = ?, Email_Contacto = ? 
       WHERE ID_Cliente = ?`,
      [
        RUT, Nombre_Cliente, Calle, Numero, Comuna, Nombre_Contacto, 
        Apellido_Paterno_Contacto, Apellido_Materno_Contacto || null, 
        Telefono_Contacto, Email_Contacto, 
        ID_Cliente
      ]
    );
    return result.affectedRows;
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('RUT')) {
         throw new Error(`El RUT '${RUT}' ya está registrado para otro cliente.`);
     }
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
}

async function eliminarCliente(ID_Cliente) {
  try {
    if (isNaN(ID_Cliente) || ID_Cliente <= 0) {
      throw new Error('ID de cliente debe ser un número positivo.');
    }

    const [result] = await pool.query('DELETE FROM Clientes WHERE ID_Cliente = ?', [ID_Cliente]);
    return result.affectedRows;
  } catch (error) {
     if (error.code === 'ER_ROW_IS_REFERENCED_2') { 
        throw new Error('No se puede eliminar el cliente porque tiene bombas asociadas.');
    }
    console.error('Error al eliminar cliente:', error);
    throw error;
  }
}

module.exports = {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};
