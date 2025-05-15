console.log('Router de tiposServicio (routes/tiposServicio.js) cargado.');

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

router.get('/activos', verificarAutenticacion, verificarRol(['administrador', 'operador']), async (req, res) => {
  console.log('Accediendo a la ruta GET /activos en tiposServicio.js'); 
  try {
    const tipos = await tiposServicioModel.obtenerTiposServicioActivos();
    res.json(tipos);
  } catch (error) {
    console.error('Error en GET /activos de tiposServicio:', error);
    res.status(500).json({ mensaje: 'Error al obtener tipos de servicio activos', error: error.message });
  }
});

router.get('/admin', verificarAutenticacion, verificarRol(['administrador']), async (req, res) => {
  console.log('Accediendo a la ruta GET /admin en tiposServicio.js');
  try {
    const tipos = await tiposServicioModel.obtenerTodosTiposServicio();
    res.json(tipos);
  } catch (error) {
    console.error('Error en GET /admin de tiposServicio:', error);
    res.status(500).json({ mensaje: 'Error al obtener todos los tipos de servicio', error: error.message });
  }
});

router.post('/admin', verificarAutenticacion, verificarRol(['administrador']), async (req, res) => {
  console.log('Accediendo a la ruta POST /admin en tiposServicio.js');
  try {
    const nuevoId = await tiposServicioModel.crearTipoServicio(req.body);
    const nuevoTipo = await tiposServicioModel.obtenerTipoServicioPorId(nuevoId); 
    res.status(201).json({ mensaje: 'Tipo de servicio creado exitosamente.', tipo_servicio: nuevoTipo });
  } catch (error) {
    console.error('Error en POST /admin de tiposServicio:', error);
    if (error.message.includes('ya existe') || error.message.includes('obligatorio')) {
        return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: 'Error al crear tipo de servicio', error: error.message });
  }
});

router.put('/admin/:id', verificarAutenticacion, verificarRol(['administrador']), async (req, res) => {
  console.log(`Accediendo a la ruta PUT /admin/${req.params.id} en tiposServicio.js`);
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
    console.error(`Error en PUT /admin/${req.params.id} de tiposServicio:`, error);
    if (error.message.includes('ya está en uso') || error.message.includes('obligatorios')) {
        return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: 'Error al actualizar tipo de servicio', error: error.message });
  }
});

router.delete('/admin/:id', verificarAutenticacion, verificarRol(['administrador']), async (req, res) => {
  console.log(`Accediendo a la ruta DELETE /admin/${req.params.id} en tiposServicio.js`);
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
    console.error(`Error en DELETE /admin/${req.params.id} de tiposServicio:`, error);
    res.status(500).json({ mensaje: 'Error al desactivar tipo de servicio', error: error.message });
  }
});

module.exports = router;
