const express = require('express');
const router = express.Router();
const usuariosModel = require('../models/usuarios');
const bcrypt = require('bcrypt');


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

router.post('/login', async (req, res) => {
  console.log('Petición a /api/usuarios/login recibida:', req.body);
  try {
    const { email, contrasena } = req.body;
    if (!email || !contrasena) {
        return res.status(400).json({ mensaje: 'Email y contraseña son requeridos.' });
    }

    const user = await usuariosModel.obtenerUsuarioPorEmail(email);

    if (!user) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, user.Contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ mensaje: '¡Contraseña incorrecta!' });
    }

    req.session.usuario = {
      ID_Usuario: user.ID_Usuario,
      Email: user.Email, 
      Rol: user.Rol,
      Nombre: user.Nombre, 
      Apellido_Paterno: user.Apellido_Paterno, 
      Apellido_Materno: user.Apellido_Materno
    };

    const usuarioParaFrontend = { ...req.session.usuario };
    delete usuarioParaFrontend.Contrasena; 

    res.json({ mensaje: 'Inicio de sesión exitoso.', usuario: usuarioParaFrontend });

  } catch (error) {
    console.error("Error en /login:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor al intentar iniciar sesión.', error: error.message });
  }
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).json({ mensaje: 'Error al cerrar sesión.' });
        }
        res.clearCookie('connect.sid'); 
        res.json({ mensaje: 'Sesión cerrada exitosamente.' });
    });
});

router.get('/me', verificarAutenticacion, async (req, res) => {
  try {
    const idUsuarioLogueado = req.session.usuario.ID_Usuario;
    const usuario = await usuariosModel.obtenerUsuarioPorId(idUsuarioLogueado);

    if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    res.json(usuario);
  } catch (error) {
    console.error("Error en /me:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor al obtener el perfil.', error: error.message });
  }
});


router.get('/', verificarRol(['administrador']), async (req, res) => {
  try {
    const usuarios = await usuariosModel.obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error("Error en GET /usuarios:", error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios.', error: error.message });
  }
});

router.post('/', verificarRol(['administrador']), async (req, res) => {
  try {
    const usuarioId = await usuariosModel.crearUsuario(req.body);
    const nuevoUsuario = await usuariosModel.obtenerUsuarioPorId(usuarioId);
    res.status(201).json({ mensaje: 'Usuario creado exitosamente.', usuario: nuevoUsuario });
  } catch (error) {
    console.error("Error en POST /usuarios:", error);
    if (error.message.includes('Email inválido') || error.message.includes('Faltan datos') || 
        error.message.includes('contraseña') || error.message.includes('ya está registrado')) {
        return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: 'Error al crear usuario.', error: error.message });
  }
});

router.put('/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const idUsuario = parseInt(req.params.id, 10);
    if (isNaN(idUsuario)) {
        return res.status(400).json({ mensaje: 'El ID de usuario debe ser un número.' });
    }

    const usuarioParaActualizar = { ...req.body, ID_Usuario: idUsuario };

    const affectedRows = await usuariosModel.actualizarUsuario(usuarioParaActualizar);

    if (affectedRows > 0) {
        const usuarioActualizado = await usuariosModel.obtenerUsuarioPorId(idUsuario);
        res.json({ mensaje: 'Usuario actualizado exitosamente.', usuario: usuarioActualizado });
    } else {
        res.status(404).json({ mensaje: 'Usuario no encontrado para actualizar.' });
    }
  } catch (error) {
    console.error(`Error en PUT /usuarios/${req.params.id}:`, error);
     if (error.message.includes('Email inválido') || error.message.includes('Faltan datos') || 
          error.message.includes('contraseña') || error.message.includes('ya está registrado')) {
        return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: 'Error al actualizar usuario.', error: error.message });
  }
});

router.delete('/:id', verificarRol(['administrador']), async (req, res) => {
  try {
    const idUsuario = parseInt(req.params.id, 10);
     if (isNaN(idUsuario)) {
        return res.status(400).json({ mensaje: 'El ID de usuario debe ser un número.' });
    }
    const affectedRows = await usuariosModel.eliminarUsuario(idUsuario);
    if (affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({ mensaje: 'Usuario no encontrado para eliminar.' });
    }
  } catch (error) {
    console.error(`Error en DELETE /usuarios/${req.params.id}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') { 
        return res.status(409).json({ mensaje: 'No se puede eliminar el usuario porque tiene registros asociados.' });
    }
    res.status(500).json({ mensaje: 'Error al eliminar usuario.', error: error.message });
  }
});

router.put('/me/password', verificarAutenticacion, async (req, res) => {
  try {
    const idUsuarioLogueado = req.session.usuario.ID_Usuario;
    const { Contrasena } = req.body;

    if (!Contrasena) {
      return res.status(400).json({ mensaje: 'La nueva contraseña es requerida.' });
    }
    if (Contrasena.length < 6) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const usuarioActual = await usuariosModel.obtenerUsuarioPorId(idUsuarioLogueado);
    if (!usuarioActual) {
         req.session.destroy();
         res.clearCookie('connect.sid');
        return res.status(404).json({ mensaje: 'Usuario no encontrado. Por favor, inicie sesión de nuevo.' });
    }

    const datosParaActualizar = {
        ID_Usuario: idUsuarioLogueado,
        Nombre: usuarioActual.Nombre,
        Apellido_Paterno: usuarioActual.Apellido_Paterno,
        Apellido_Materno: usuarioActual.Apellido_Materno,
        Email: usuarioActual.Email,
        Rol: usuarioActual.Rol,
        Contrasena: Contrasena
    };

    const affectedRows = await usuariosModel.actualizarUsuario(datosParaActualizar);

    if (affectedRows > 0) {
      res.json({ mensaje: 'Contraseña actualizada exitosamente.' });
    } else {
      res.status(500).json({ mensaje: 'No se pudo actualizar la contraseña.' });
    }
  } catch (error) {
    console.error('Error en PUT /api/usuarios/me/password:', error);
    if (error.message.includes('contraseña') || error.message.includes('Email inválido') || error.message.includes('Faltan datos')) {
        return res.status(400).json({ mensaje: error.message });
    }
     if (error.message.includes('ya está registrado')) { 
        return res.status(409).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: 'Error interno del servidor al actualizar la contraseña.', error: error.message });
  }
});

module.exports = router;
