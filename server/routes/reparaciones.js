const express = require('express');
const router = express.Router();
const reparacionesModel = require('../models/reparaciones');
const bombasModel = require('../models/bombas'); 

router.get('/', async (req, res) => {
  try {
    const reparaciones = await reparacionesModel.obtenerReparaciones();
    res.json(reparaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const reparacionId = await reparacionesModel.crearReparacion(req.body);
    res.json({ reparacionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const reparacion = await reparacionesModel.actualizarReparacion(req.params.id, req.body);
    res.json(reparacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const reparacion = await reparacionesModel.eliminarReparacion(req.params.id);
    res.json(reparacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bomba/:bombaId', async (req, res) => {
  try {
    const { bombaId } = req.params;

    const bomba = await bombasModel.obtenerBombaPorId(bombaId); 

    const ultimaReparacion = await reparacionesModel.obtenerUltimaReparacionDeBomba(bombaId);

    if (ultimaReparacion) {
      res.json({ bomba, ultimaReparacion }); 
    } else {
      res.status(404).json({ mensaje: 'No se encontraron reparaciones para esta bomba.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
