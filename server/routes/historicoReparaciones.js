const express = require('express');
const router = express.Router();
const historicoModel = require('../models/historicoReparaciones');

router.get('/', async (req, res) => {
  try {
    const historico = await historicoModel.obtenerHistoricoReparaciones();
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const historicoId = await historicoModel.crearHistoricoReparacion(req.body);
    res.json({ historicoId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const historico = await historicoModel.actualizarHistorico(req.params.id, req.body);
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const historico = await historicoModel.eliminarHistorico(req.params.id);
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
