console.log('Router principal (routes/index.js) cargado.');

const express = require("express");
const router = express.Router();
const clientesRoutes = require('./clientes');
const bombasRoutes = require('./bombas');
const reparacionesRoutes = require('./reparaciones');
const usuariosRoutes = require('./usuarios');
const tiposServicioRoutes = require('./tiposServicio');
const tiposBombaRoutes = require('./tiposBomba');

router.use('/clientes', clientesRoutes);
router.use('/bombas', bombasRoutes);
router.use('/reparaciones', reparacionesRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/tipos_servicio', tiposServicioRoutes);
console.log('Rutas de tipos_servicio montadas en /tipos_servicio');
router.use('/tipos_bomba', tiposBombaRoutes);

module.exports = router;
