const express = require('express');
const router = express.Router();
const bombasModel = require('../models/bombas');

router.get('/', async (req, res) => {
  try {
    const bombas = await bombasModel.obtenerBombas();
    res.json(bombas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const bombaId = await bombasModel.crearBomba(req.body);
    res.json({ bombaId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const bomba = await bombasModel.actualizarBomba(req.params.id, req.body);
    res.json(bomba);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const bomba = await bombasModel.eliminarBomba(req.params.id);
    res.json(bomba);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bomba = await bombasModel.obtenerBombaPorId(req.params.id);
    res.json(bomba);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;