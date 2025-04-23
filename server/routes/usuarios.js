const express = require('express');
const router = express.Router();
const usuariosModel = require('../models/usuarios');
const bcrypt = require('bcrypt');
const bombasModel = require('../models/bombas');
const clientesModel = require('../models/clientes');
const reparacionesModel = require('../models/reparaciones');
const historicoModel = require('../models/historicoReparaciones');
const tecnicosModel = require('../models/tecnicos');

const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.session.usuario || !rolesPermitidos.includes(req.session.usuario.rol)) {
      return res.status(403).json({ mensaje: 'Acceso denegado.' });
    }
    next();
  };
};

router.post('/login', async (req, res) => {
  console.log('Petición a /api/usuarios/login recibida:', req.body); 
  try {
    const { usuario, contrasena } = req.body;
    const user = await usuariosModel.obtenerUsuarioPorUsuario(usuario);

    if (!user) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado.' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, user.Contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    req.session.usuario = {
      ID_Usuario: user.ID_Usuario,
      Usuario: user.Usuario,
      Rol: user.Rol,
    };
    res.json({ mensaje: 'Inicio de sesión exitoso.', usuario: req.session.usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/perfil', verificarRol(['administrador']), (req, res) => {
  res.json({ mensaje: 'Perfil del administrador.', usuario: req.session.usuario });
});

router.get('/', verificarRol(['administrador']), async (req, res) => {
  try {
    const usuarios = await usuariosModel.obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', verificarRol(['administrador']), async (req, res) => {
  try {
    const usuarioId = await usuariosModel.crearUsuario(req.body);
    res.json({ usuarioId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const usuario = await usuariosModel.actualizarUsuario(req.params.id, req.body);
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const usuario = await usuariosModel.eliminarUsuario(req.params.id);
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tecnicos', verificarRol(['administrador']), async (req, res) => {
  try {
    const tecnico = await tecnicosModel.crearTecnico(req.body);
    res.json(tecnico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/tecnicos/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const tecnico = await tecnicosModel.actualizarTecnico(req.params.id, req.body);
    res.json(tecnico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/tecnicos/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const tecnico = await tecnicosModel.eliminarTecnico(req.params.id);
    res.json(tecnico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/clientes', verificarRol(['administrador']), async (req, res) => {
  try {
    const cliente = await clientesModel.crearCliente(req.body);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/clientes/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const cliente = await clientesModel.actualizarCliente(req.params.id, req.body);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/clientes/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const cliente = await clientesModel.eliminarCliente(req.params.id);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bombas', verificarRol(['administrador']), async (req, res) => {
  try {
    const bomba = await bombasModel.crearBomba(req.body);
    res.json(bomba);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/bombas/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const bomba = await bombasModel.actualizarBomba(req.params.id, req.body);
    res.json(bomba);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bombas/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const bomba = await bombasModel.eliminarBomba(req.params.id);
    res.json(bomba);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reparaciones', verificarRol(['administrador']), async (req, res) => {
  try {
    const reparacion = await reparacionesModel.crearReparacion(req.body);
    res.json(reparacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/reparaciones/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const reparacion = await reparacionesModel.actualizarReparacion(req.params.id, req.body);
    res.json(reparacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/reparaciones/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const reparacion = await reparacionesModel.eliminarReparacion(req.params.id);
    res.json(reparacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/clientes/operador', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const cliente = await clientesModel.crearCliente(req.body);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/clientes/operador/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const cliente = await clientesModel.actualizarCliente(req.params.id, req.body);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/clientes/operador/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const cliente = await clientesModel.eliminarCliente(req.params.id);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bombas/operador', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const bomba = await bombasModel.crearBomba(req.body);
    res.json(bomba);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/bombas/operador/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const bomba = await bombasModel.actualizarBomba(req.params.id, req.body);
    res.json(bomba);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bombas/operador/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const bomba = await bombasModel.eliminarBomba(req.params.id);
    res.json(bomba);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/reparaciones/tecnico/:id', verificarRol(['administrador', 'tecnico']), async (req, res) => {
  try {
    const reparaciones = await reparacionesModel.obtenerReparaciones();
    const filtro = reparaciones.filter((reparacion) => reparacion.ID_Bomba === parseInt(req.params.id));
    res.json(filtro);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/historico/tecnico/:id', verificarRol(['administrador', 'tecnico']), async (req, res) => {
  try {
    const historico = await historicoModel.obtenerHistoricoReparaciones();
    const filtro = historico.filter((hist) => hist.ID_Bomba === parseInt(req.params.id));
    res.json(filtro);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

