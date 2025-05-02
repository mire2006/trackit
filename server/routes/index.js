const express = require("express");
const router = express.Router();
const clientesRoutes = require('./clientes');
const bombasRoutes = require('./bombas');
const reparacionesRoutes = require('./reparaciones');
const usuariosRoutes = require('./usuarios');
const historicoReparacionesRoutes = require('./historicoReparaciones');

router.use('/clientes', clientesRoutes);
router.use('/bombas', bombasRoutes);
router.use('/reparaciones', reparacionesRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/historico', historicoReparacionesRoutes);

module.exports = router;
