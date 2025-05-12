const express = require('express');
const router = express.Router();
const tiposBombaModel = require('../models/tiposBomba');

const verificarAutenticacion = (req, res, next) => {
    if (!req.session.usuario) {
      return res.status(401).json({ mensaje: 'No autorizado. Por favor, inicie sesión.' });
    }
    next();
  };
  
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
      if (!req.session.usuario) { 
        return res.status(401).json({ mensaje: 'No autorizado. Por favor, inicie sesión.' });
      }
      if (!rolesPermitidos.includes(req.session.usuario.Rol)) {
        return res.status(403).json({ mensaje: 'Acceso denegado. No tiene los permisos necesarios.' });
      }
      next();
    };
  };

router.get('/', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const tipos = await tiposBombaModel.obtenerTodosTiposBomba();
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener tipos de bomba', error: error.message });
  }
});

router.get('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
           return res.status(400).json({ mensaje: 'El ID debe ser un número.' });
        }
        const tipo = await tiposBombaModel.obtenerTipoBombaPorId(id);
        if (tipo) {
            res.json(tipo);
        } else {
            res.status(404).json({ mensaje: 'Tipo de bomba no encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el tipo de bomba', error: error.message });
    }
});

router.post('/', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const nuevoId = await tiposBombaModel.crearTipoBomba(req.body);
    const nuevoTipo = await tiposBombaModel.obtenerTipoBombaPorId(nuevoId);
    res.status(201).json({ mensaje: 'Tipo de bomba creado exitosamente.', tipo_bomba: nuevoTipo });
  } catch (error) {
      if (error.message.includes('obligatorio') || error.message.includes('ya existe')) {
           return res.status(400).json({ mensaje: error.message });
      }
    res.status(500).json({ mensaje: 'Error al crear tipo de bomba', error: error.message });
  }
});

router.put('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
     if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID debe ser un número.' });
    }
    const tipoActualizado = { ...req.body, ID_Tipo_Bomba: id };
    const affectedRows = await tiposBombaModel.actualizarTipoBomba(tipoActualizado);

    if (affectedRows > 0) {
      const tipoActualizadoData = await tiposBombaModel.obtenerTipoBombaPorId(id);
      res.json({ mensaje: 'Tipo de bomba actualizado exitosamente.', tipo_bomba: tipoActualizadoData });
    } else {
      res.status(404).json({ mensaje: 'Tipo de bomba no encontrado.' });
    }
  } catch (error) {
     if (error.message.includes('obligatorio') || error.message.includes('ya existe')) {
           return res.status(400).json({ mensaje: error.message });
      }
    res.status(500).json({ mensaje: 'Error al actualizar tipo de bomba', error: error.message });
  }
});

router.delete('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
     const id = parseInt(req.params.id, 10);
     if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID debe ser un número.' });
    }
    const affectedRows = await tiposBombaModel.eliminarTipoBomba(id);
    if (affectedRows > 0) {
      res.status(204).send(); 
    } else {
      res.status(404).json({ mensaje: 'Tipo de bomba no encontrado.' });
    }
  } catch (error) {
     if (error.message.includes('siendo utilizado')) {
           return res.status(409).json({ mensaje: error.message }); 
      }
    res.status(500).json({ mensaje: 'Error al eliminar tipo de bomba', error: error.message });
  }
});

module.exports = router;
