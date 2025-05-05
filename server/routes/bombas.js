const express = require('express');
const router = express.Router();
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
    const bombas = await bombasModel.obtenerBombas();
    res.json(bombas);
  } catch (error) {
     console.error("Error en GET /bombas:", error);
    res.status(500).json({ mensaje: 'Error al obtener bombas', error: error.message });
  }
});

router.get('/:id', verificarAutenticacion, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
     if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID de bomba debe ser un número.' });
    }
    const bomba = await bombasModel.obtenerBombaPorId(id);
    if (bomba) {
      res.json(bomba);
    } else {
      res.status(404).json({ mensaje: 'Bomba no encontrada.' });
    }
  } catch (error) {
     console.error(`Error en GET /bombas/${req.params.id}:`, error);
    res.status(500).json({ mensaje: 'Error al obtener la bomba', error: error.message });
  }
});

router.post('/', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const bombaData = req.body; 
    
    const bombaId = await bombasModel.crearBomba(bombaData);
    const nuevaBomba = await bombasModel.obtenerBombaPorId(bombaId);
    res.status(201).json({ mensaje: 'Bomba creada exitosamente.', bomba: nuevaBomba });
  } catch (error) {
    console.error("Error en POST /bombas:", error);
     if (error.message.includes('obligatorio') || error.message.includes('número') || 
     error.message.includes('exceder') || error.message.includes('no existe')) {
         return res.status(400).json({ mensaje: error.message });
     }
     if (error.message.includes('código QR único')) {
          return res.status(500).json({ mensaje: error.message });
     }
    res.status(500).json({ mensaje: 'Error al crear la bomba', error: error.message });
  }
});

router.put('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const idBomba = parseInt(req.params.id, 10);
    if (isNaN(idBomba)) {
      return res.status(400).json({ mensaje: 'El ID de bomba debe ser un número.' });
    }
    const bombaData = { ...req.body, ID_Bomba: idBomba }; 

    const affectedRows = await bombasModel.actualizarBomba(bombaData);

    if (affectedRows > 0) {
        const bombaActualizada = await bombasModel.obtenerBombaPorId(idBomba);
      res.json({ mensaje: 'Bomba actualizada exitosamente.', bomba: bombaActualizada });
    } else {
      res.status(404).json({ mensaje: 'Bomba no encontrada para actualizar.' });
    }
  } catch (error) {
    console.error(`Error en PUT /bombas/${req.params.id}:`, error);
     if (error.message.includes('obligatorio') || error.message.includes('número') || 
     error.message.includes('exceder') || error.message.includes('no existe')) {
         return res.status(400).json({ mensaje: error.message });
     }
    res.status(500).json({ mensaje: 'Error al actualizar la bomba', error: error.message });
  }
});

router.delete('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ mensaje: 'El ID de bomba debe ser un número.' });
    }
    const affectedRows = await bombasModel.eliminarBomba(id);

    if (affectedRows > 0) {
        res.status(204).send(); 
    } else {
        res.status(404).json({ mensaje: 'Bomba no encontrada para eliminar.' });
    }
  } catch (error) {
     console.error(`Error en DELETE /bombas/${req.params.id}:`, error);
      if (error.message.includes('reparaciones asociadas')) {
           return res.status(409).json({ mensaje: error.message });
      }
    res.status(500).json({ mensaje: 'Error al eliminar la bomba', error: error.message });
  }
});


router.get('/cliente/:clienteId', verificarAutenticacion, async (req, res) => {
    try {
       const clienteId = parseInt(req.params.clienteId, 10);
        if (isNaN(clienteId)) {
            return res.status(400).json({ mensaje: 'El ID de cliente debe ser un número.' });
        }
        const bombas = await bombasModel.obtenerBombasPorCliente(clienteId);
        res.json(bombas);
    } catch (error) {
         console.error(`Error en GET /bombas/cliente/${req.params.clienteId}:`, error);
        res.status(500).json({ mensaje: 'Error al obtener bombas del cliente', error: error.message });
    }
});


module.exports = router;
