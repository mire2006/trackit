const express = require('express');
const router = express.Router();
const clientesModel = require('../models/clientes');

router.get('/', async (req, res) => {
  try {
    const clientes = await clientesModel.obtenerClientes();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const clienteId = await clientesModel.crearCliente(req.body);
    res.json({ clienteId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const cliente = await clientesModel.actualizarCliente(req.params.id, req.body);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const cliente = await clientesModel.eliminarCliente(req.params.id);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
