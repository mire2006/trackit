const pool = require('../db');

async function obtenerTodosTiposBomba() {
  try {
    const [rows] = await pool.query(
      'SELECT ID_Tipo_Bomba, Marca, Modelo, Descripcion_Tecnica FROM Tipos_Bomba ORDER BY Marca ASC, Modelo ASC'
      );
    return rows;
  } catch (error) {
    console.error('Error al obtener tipos de bomba:', error);
    throw error;
  }
}

async function obtenerTipoBombaPorId(id) {
  try {
    if (isNaN(id)) {
        throw new Error('El ID del tipo de bomba debe ser un número.');
    }
    const [rows] = await pool.query(
        'SELECT * FROM Tipos_Bomba WHERE ID_Tipo_Bomba = ?', 
        [id]
        );
    return rows[0];
  } catch (error) {
    console.error('Error al obtener tipo de bomba por ID:', error);
    throw error;
  }
}

async function crearTipoBomba(tipoBomba) {
  try {
    const { Marca, Modelo, Descripcion_Tecnica } = tipoBomba;
    if (!Marca || !Modelo) {
      throw new Error('Marca y Modelo son obligatorios.');
    }
    
    const [result] = await pool.query(
      'INSERT INTO Tipos_Bomba (Marca, Modelo, Descripcion_Tecnica) VALUES (?, ?, ?)',
      [Marca, Modelo, Descripcion_Tecnica || null]
    );
    return result.insertId;
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`La combinación Marca '${Marca}' y Modelo '${Modelo}' ya existe.`);
    }
    console.error('Error al crear tipo de bomba:', error);
    throw error;
  }
}

async function actualizarTipoBomba(tipoBomba) {
  try {
    const { ID_Tipo_Bomba, Marca, Modelo, Descripcion_Tecnica } = tipoBomba;
     if (!ID_Tipo_Bomba || !Marca || !Modelo) {
      throw new Error('ID, Marca y Modelo son obligatorios para actualizar.');
    }
     if (isNaN(ID_Tipo_Bomba)) {
        throw new Error('El ID del tipo de bomba debe ser un número.');
    }

    const [result] = await pool.query(
      'UPDATE Tipos_Bomba SET Marca = ?, Modelo = ?, Descripcion_Tecnica = ? WHERE ID_Tipo_Bomba = ?',
      [Marca, Modelo, Descripcion_Tecnica || null, ID_Tipo_Bomba]
    );
    return result.affectedRows;
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`La combinación Marca '${Marca}' y Modelo '${Modelo}' ya existe para otro registro.`);
    }
    console.error('Error al actualizar tipo de bomba:', error);
    throw error;
  }
}

async function eliminarTipoBomba(id) {
  try {
     if (isNaN(id)) {
        throw new Error('El ID del tipo de bomba debe ser un número.');
    }
    const [result] = await pool.query(
        'DELETE FROM Tipos_Bomba WHERE ID_Tipo_Bomba = ?', 
        [id]
        );
    return result.affectedRows;
  } catch (error) {
     if (error.code === 'ER_ROW_IS_REFERENCED_2') { 
        throw new Error('No se puede eliminar este tipo de bomba porque está siendo utilizado por una o más bombas registradas.');
    }
    console.error('Error al eliminar tipo de bomba:', error);
    throw error;
  }
}

module.exports = {
  obtenerTodosTiposBomba,
  obtenerTipoBombaPorId,
  crearTipoBomba,
  actualizarTipoBomba,
  eliminarTipoBomba,
};
