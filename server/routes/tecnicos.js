const express = require('express');
const router = express.Router();
const tecnicosModel = require('../models/tecnicos');

router.get('/', async (req, res) => {
  try {
    const tecnicos = await tecnicosModel.obtenerTecnicos();
    res.json(tecnicos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const tecnicoId = await tecnicosModel.crearTecnico(req.body);
    res.json({ tecnicoId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const tecnico = await tecnicosModel.actualizarTecnico(req.params.id, req.body);
    res.json(tecnico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const tecnico = await tecnicosModel.eliminarTecnico(req.params.id);
    res.json(tecnico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
