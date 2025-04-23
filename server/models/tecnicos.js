const pool = require('../db');

async function obtenerTecnicos() {
  try {
    const [rows] = await pool.query('SELECT * FROM Tecnicos');
    return rows;
  } catch (error) {
    console.error('Error al obtener técnicos:', error);
    throw error;
  }
}

async function crearTecnico(tecnico) {
  try {
    const { Nombre, Telefono, Email } = tecnico;

    if (!Nombre || !Telefono || !Email) {
      throw new Error('Nombre, Teléfono y Email son obligatorios');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
      throw new Error('Formato de Email inválido');
    }
    
    if(!/^\d+$/.test(Telefono)){
        throw new Error('Formato de Telefono invalido, solo números');
    }
    
    if(Telefono.length !== 9){
        throw new Error('El numero de telefono debe tener 9 dígitos');
    }

    const [result] = await pool.query(
      'INSERT INTO Tecnicos (Nombre, Telefono, Email) VALUES (?, ?, ?)',
      [Nombre, Telefono, Email]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error al crear técnico:', error);
    throw error;
  }
}

async function actualizarTecnico(tecnico) {
  try {
    const { ID_Tecnico, Nombre, Telefono, Email } = tecnico;
    
    if(!ID_Tecnico || !Nombre || !Telefono || !Email){
        throw new Error("ID_Tecnico, Nombre, Telefono y Email son obligatorios");
    }
    
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)){
        throw new Error("Formato de Email invalido");
    }
    
    if(!/^\d+$/.test(Telefono)){
        throw new Error('Formato de Telefono invalido, solo números');
    }
    
    if(Telefono.length !== 9){
        throw new Error("El numero de telefono debe tener 9 dígitos");
    }

    const [result] = await pool.query(
      'UPDATE Tecnicos SET Nombre = ?, Telefono = ?, Email = ? WHERE ID_Tecnico = ?',
      [Nombre, Telefono, Email, ID_Tecnico]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error al actualizar técnico:', error);
    throw error;
  }
}

async function eliminarTecnico(ID_Tecnico) {
  try {
    if(!ID_Tecnico){
        throw new Error('ID de técnico es obligatorio');
    }
    const [result] = await pool.query('DELETE FROM Tecnicos WHERE ID_Tecnico = ?', [ID_Tecnico]);
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar técnico:', error);
    throw error;
  }
}

async function obtenerTecnicoPorId(ID_Tecnico){
  try{
     if(!ID_Tecnico){
        throw new Error("ID de técnico es obligatorio");
    }
    const [rows] = await pool.query('SELECT * FROM Tecnicos WHERE ID_Tecnico = ?', [ID_Tecnico]);
    return rows[0];
  }catch(error){
    console.log("Error al obtener tecnico", error);
    throw error;
  }
}

module.exports = {
  obtenerTecnicos,
  crearTecnico,
  actualizarTecnico,
  eliminarTecnico,
  obtenerTecnicoPorId,
};