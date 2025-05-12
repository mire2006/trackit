const express = require('express');
const router = express.Router();
const reparacionesModel = require('../models/reparaciones');
const bombasModel = require('../models/bombas');

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

router.get('/', verificarAutenticacion, async (req, res) => {
  try {
    const reparaciones = await reparacionesModel.obtenerReparaciones();
    res.json(reparaciones);
  } catch (error) {
     console.error("Error en GET /api/reparaciones:", error);
    res.status(500).json({ mensaje: 'Error al obtener reparaciones', error: error.message });
  }
});

router.get('/:id', verificarAutenticacion, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
           return res.status(400).json({ mensaje: 'El ID de reparación debe ser un número.' });
        }
        const reparacion = await reparacionesModel.obtenerReparacionPorId(id);
        if (reparacion) {
            res.json(reparacion);
        } else {
            res.status(404).json({ mensaje: 'Reparación no encontrada.' });
        }
    } catch (error) {
        console.error(`Error en GET /api/reparaciones/${req.params.id}:`, error);
        res.status(500).json({ mensaje: 'Error al obtener la reparación', error: error.message });
    }
});

router.post('/', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const reparacionData = req.body; 
    
    if (!reparacionData.tiposServicioIds || !Array.isArray(reparacionData.tiposServicioIds) || reparacionData.tiposServicioIds.length === 0) {
       return res.status(400).json({ mensaje: 'Debe proporcionar un array con IDs de tipos de servicio.' });
    }

    const reparacionId = await reparacionesModel.crearReparacion(reparacionData);
    const nuevaReparacion = await reparacionesModel.obtenerReparacionPorId(reparacionId);
    res.status(201).json({ mensaje: 'Reparación creada exitosamente.', reparacion: nuevaReparacion });

  } catch (error) {
     console.error("Error en POST /api/reparaciones:", error);
     if (error.message.includes('obligatorio') || error.message.includes('número') || error.message.includes('tipo de servicio') || error.message.includes('Error de referencia')) {
         return res.status(400).json({ mensaje: error.message });
     }
    res.status(500).json({ mensaje: 'Error al crear la reparación', error: error.message });
  }
});

router.put('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const idReparacion = parseInt(req.params.id, 10);
    if (isNaN(idReparacion)) {
      return res.status(400).json({ mensaje: 'El ID de reparación debe ser un número.' });
    }

    const reparacionData = { ...req.body, ID_Reparacion: idReparacion }; 

     if (!reparacionData.tiposServicioIds || !Array.isArray(reparacionData.tiposServicioIds) || reparacionData.tiposServicioIds.length === 0) {
       return res.status(400).json({ mensaje: 'Debe proporcionar un array con IDs de tipos de servicio.' });
    }

    const affectedRows = await reparacionesModel.actualizarReparacion(reparacionData);

    if (affectedRows > 0) {
       const reparacionActualizada = await reparacionesModel.obtenerReparacionPorId(idReparacion);
      res.json({ mensaje: 'Reparación actualizada exitosamente.', reparacion: reparacionActualizada });
    } else {
      res.status(404).json({ mensaje: 'Reparación no encontrada para actualizar o datos idénticos.' });
    }
  } catch (error) {
    console.error(`Error en PUT /api/reparaciones/${req.params.id}:`, error);
     if (error.message.includes('obligatorio') || error.message.includes('número') || error.message.includes('tipo de servicio') || error.message.includes('Error de referencia')) {
         return res.status(400).json({ mensaje: error.message });
     }
    res.status(500).json({ mensaje: 'Error al actualizar la reparación', error: error.message });
  }
});

router.delete('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
     const id = parseInt(req.params.id, 10);
     if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID de reparación debe ser un número.' });
    }
    const affectedRows = await reparacionesModel.eliminarReparacion(id);
    if (affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({ mensaje: 'Reparación no encontrada para eliminar.' });
    }
  } catch (error) {
    console.error(`Error en DELETE /api/reparaciones/${req.params.id}:`, error);
    res.status(500).json({ mensaje: 'Error al eliminar la reparación', error: error.message });
  }
});

router.get('/bomba/:bombaId/informe', verificarAutenticacion, async (req, res) => {
  console.log(`Acceso a RUTA INFORME: /api/reparaciones/bomba/${req.params.bombaId}/informe`);
  try {
    const bombaId = parseInt(req.params.bombaId, 10);
    if (isNaN(bombaId) || bombaId <= 0) {
      return res.status(400).json({ mensaje: 'El ID de bomba debe ser un número positivo.' });
    }

    const bomba = await bombasModel.obtenerBombaPorId(bombaId); 
    if (!bomba) {
      return res.status(404).json({ mensaje: 'Bomba no encontrada.' });
    }

    const reparaciones = await reparacionesModel.obtenerReparacionesDeBomba(bombaId);

    res.json({ 
        bomba: { 
            Nombre_Cliente: bomba.Nombre_Cliente,
            Marca: bomba.Marca,
            Modelo: bomba.Modelo,
            Circuito: bomba.Circuito 
        }, 
        reparaciones
    });

  } catch (error) {
    console.error(`Error en GET /api/reparaciones/bomba/${req.params.bombaId}/informe:`, error);
    res.status(500).json({ mensaje: 'Error al obtener datos para el informe de la bomba.', error: error.message || 'Error interno del servidor' });
  }
});

module.exports = router;
