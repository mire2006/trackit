const pool = require('../db');

async function obtenerClientes() {
  try {
    const query = `
      SELECT "ID_Cliente", "RUT", "Nombre_Cliente", "Calle", "Numero", "Comuna", 
             "Nombre_Contacto", "Apellido_Paterno_Contacto", "Apellido_Materno_Contacto", 
             "Telefono_Contacto", "Email_Contacto" 
      FROM "clientes" 
      ORDER BY "Nombre_Cliente" ASC
    `;
    const result = await pool.query(query);
    return result.rows;
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
    const query = `
      SELECT "ID_Cliente", "RUT", "Nombre_Cliente", "Calle", "Numero", "Comuna", 
             "Nombre_Contacto", "Apellido_Paterno_Contacto", "Apellido_Materno_Contacto", 
             "Telefono_Contacto", "Email_Contacto" 
      FROM "clientes" 
      WHERE "ID_Cliente" = $1
    `;
    const result = await pool.query(query, [idCliente]);
    return result.rows[0];
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

    const query = `
      INSERT INTO "clientes" 
        ("RUT", "Nombre_Cliente", "Calle", "Numero", "Comuna", "Nombre_Contacto", 
         "Apellido_Paterno_Contacto", "Apellido_Materno_Contacto", "Telefono_Contacto", "Email_Contacto") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING "ID_Cliente"
    `;
    const values = [
      RUT, Nombre_Cliente, Calle, Numero, Comuna, Nombre_Contacto,
      Apellido_Paterno_Contacto, Apellido_Materno_Contacto || null,
      Telefono_Contacto, Email_Contacto
    ];
    const result = await pool.query(query, values);
    
    if (result.rows && result.rows.length > 0) {
      return result.rows[0]['ID_Cliente'];
    } else {
      throw new Error('No se pudo crear el cliente u obtener el ID.');
    }
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'UQ_RUT') {
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

    const query = `
      UPDATE "clientes" SET 
        "RUT" = $1, "Nombre_Cliente" = $2, "Calle" = $3, "Numero" = $4, "Comuna" = $5, 
        "Nombre_Contacto" = $6, "Apellido_Paterno_Contacto" = $7, "Apellido_Materno_Contacto" = $8, 
        "Telefono_Contacto" = $9, "Email_Contacto" = $10 
      WHERE "ID_Cliente" = $11
    `;
    const values = [
      RUT, Nombre_Cliente, Calle, Numero, Comuna, Nombre_Contacto,
      Apellido_Paterno_Contacto, Apellido_Materno_Contacto || null,
      Telefono_Contacto, Email_Contacto,
      ID_Cliente
    ];
    const result = await pool.query(query, values);
    return result.rowCount;
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'UQ_RUT') {
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

    const query = 'DELETE FROM "clientes" WHERE "ID_Cliente" = $1';
    const result = await pool.query(query, [ID_Cliente]);
    return result.rowCount;
  } catch (error) {
    if (error.code === '23503') {
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
