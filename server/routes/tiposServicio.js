const express = require('express');
const router = express.Router();
const tiposServicioModel = require('../models/tiposServicio');

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
    const tipos = await tiposServicioModel.obtenerTiposServicioActivos();
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener tipos de servicio activos', error: error.message });
  }
});

router.get('/admin', verificarRol(['administrador']), async (req, res) => {
    try {
      const tipos = await tiposServicioModel.obtenerTodosTiposServicio();
      res.json(tipos);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener todos los tipos de servicio', error: error.message });
    }
  });

router.post('/admin', verificarRol(['administrador']), async (req, res) => {
  try {
    const nuevoId = await tiposServicioModel.crearTipoServicio(req.body);
    const nuevoTipo = await tiposServicioModel.obtenerTipoServicioPorId(nuevoId); 
    res.status(201).json({ mensaje: 'Tipo de servicio creado exitosamente.', tipo_servicio: nuevoTipo });
  } catch (error) {
      if (error.message.includes('ya existe') || error.message.includes('obligatorio')) {
           return res.status(400).json({ mensaje: error.message });
      }
    res.status(500).json({ mensaje: 'Error al crear tipo de servicio', error: error.message });
  }
});

router.put('/admin/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
     if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID debe ser un número.' });
    }
    const tipoActualizado = { ...req.body, ID_Tipo_Servicio: id };
    const affectedRows = await tiposServicioModel.actualizarTipoServicio(tipoActualizado);

    if (affectedRows > 0) {
      const tipoActualizadoData = await tiposServicioModel.obtenerTipoServicioPorId(id);
      res.json({ mensaje: 'Tipo de servicio actualizado exitosamente.', tipo_servicio: tipoActualizadoData });
    } else {
      res.status(404).json({ mensaje: 'Tipo de servicio no encontrado.' });
    }
  } catch (error) {
     if (error.message.includes('ya está en uso') || error.message.includes('obligatorios')) {
           return res.status(400).json({ mensaje: error.message });
      }
    res.status(500).json({ mensaje: 'Error al actualizar tipo de servicio', error: error.message });
  }
});

router.delete('/admin/:id', verificarRol(['administrador']), async (req, res) => {
  try {
     const id = parseInt(req.params.id, 10);
     if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID debe ser un número.' });
    }
    const affectedRows = await tiposServicioModel.eliminarTipoServicio(id);
    if (affectedRows > 0) {
      res.status(200).json({ mensaje: 'Tipo de servicio desactivado exitosamente.' }); 
    } else {
      res.status(404).json({ mensaje: 'Tipo de servicio no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al desactivar tipo de servicio', error: error.message });
  }
});


module.exports = router;
