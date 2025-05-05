const express = require('express');
const router = express.Router();
const clientesModel = require('../models/clientes');

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

router.get('/', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const clientes = await clientesModel.obtenerClientes();
    res.json(clientes);
  } catch (error) {
    console.error("Error en GET /clientes:", error);
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: error.message });
  }
});

router.get('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
           return res.status(400).json({ mensaje: 'El ID de cliente debe ser un número.' });
        }
        const cliente = await clientesModel.obtenerClientePorId(id);
        if (cliente) {
            res.json(cliente);
        } else {
            res.status(404).json({ mensaje: 'Cliente no encontrado.' });
        }
    } catch (error) {
        console.error(`Error en GET /clientes/${req.params.id}:`, error);
        res.status(500).json({ mensaje: 'Error al obtener el cliente', error: error.message });
    }
});


router.post('/', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const clienteData = req.body; 
    const clienteId = await clientesModel.crearCliente(clienteData);
    const nuevoCliente = await clientesModel.obtenerClientePorId(clienteId);
    res.status(201).json({ mensaje: 'Cliente creado exitosamente.', cliente: nuevoCliente });
  } catch (error) {
    console.error("Error en POST /clientes:", error);
     if (error.message.includes('obligatorio') || error.message.includes('ya está registrado')) {
         return res.status(400).json({ mensaje: error.message });
     }
    res.status(500).json({ mensaje: 'Error al crear el cliente', error: error.message });
  }
});

router.put('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const idCliente = parseInt(req.params.id, 10);
     if (isNaN(idCliente)) {
      return res.status(400).json({ mensaje: 'El ID de cliente debe ser un número.' });
    }

    const clienteData = { ...req.body, ID_Cliente: idCliente }; 

    const affectedRows = await clientesModel.actualizarCliente(clienteData);

    if (affectedRows > 0) {
        const clienteActualizado = await clientesModel.obtenerClientePorId(idCliente);
      res.json({ mensaje: 'Cliente actualizado exitosamente.', cliente: clienteActualizado });
    } else {
      res.status(404).json({ mensaje: 'Cliente no encontrado para actualizar.' });
    }
  } catch (error) {
     console.error(`Error en PUT /clientes/${req.params.id}:`, error);
      if (error.message.includes('obligatorio') || error.message.includes('ya está registrado')) {
         return res.status(400).json({ mensaje: error.message });
     }
    res.status(500).json({ mensaje: 'Error al actualizar el cliente', error: error.message });
  }
});

router.delete('/:id', verificarRol(['administrador', 'operador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ mensaje: 'El ID de cliente debe ser un número.' });
    }
    const affectedRows = await clientesModel.eliminarCliente(id);

    if (affectedRows > 0) {
        res.status(204).send(); 
    } else {
        res.status(404).json({ mensaje: 'Cliente no encontrado para eliminar.' });
    }
  } catch (error) {
     console.error(`Error en DELETE /clientes/${req.params.id}:`, error);
      if (error.message.includes('bombas asociadas')) {
           return res.status(409).json({ mensaje: error.message });
      }
    res.status(500).json({ mensaje: 'Error al eliminar el cliente', error: error.message });
  }
});

module.exports = router;
