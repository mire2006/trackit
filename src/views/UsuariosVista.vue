<template>
  <div class="gestion-container">
    <h1>Gestión de Usuarios</h1>
    <p class="subtitulo">Crea, visualiza, edita y elimina usuarios del sistema.</p>

    <div class="toolbar-container">
      <button @click="abrirModalCrear" class="btn-crear" :disabled="cargandoGlobal">
        Crear Nuevo Usuario
      </button>
      <div class="search-wrapper">
        <BarraBusqueda
          v-model="searchTermUsuario"
          placeholder="Buscar por ID, Nombre, Email, Rol..."
          :disabled="cargandoGlobal"
        />
      </div>
    </div>

    <div v-if="cargandoGlobal" class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando usuarios...</p>
    </div>

    <div v-if="errorApi" class="error-message-api">
      {{ errorApi }}
    </div>
    
    <div v-if="mostrarMensajeExitoGlobal" class="mensaje-exito-global">
      <span class="icono-exito">✓</span> {{ mensajeExitoGlobalTexto }}
    </div>

    <TablaUsuarios
      v-if="!cargandoGlobal && !errorApi"
      :usuarios="filteredUsuarios"
      @editar="abrirModalEditar"
      @eliminar="confirmarEliminacion"
    />
    <div v-if="!cargandoGlobal && !errorApi && filteredUsuarios.length === 0 && searchTermUsuario" class="no-datos">
      <p>No se encontraron usuarios que coincidan con "{{ searchTermUsuario }}".</p>
    </div>

    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ esEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}</h2>
        <FormularioUsuario
          :usuario-data="usuarioActual"
          :es-edicion="esEdicion"
          :cargando="cargandoFormulario"
          :error-formulario-prop="errorFormulario"
          @guardar="procesarGuardadoUsuario"
          @cancelar="cerrarModal"
        />
      </div>
    </div>
    
    <div v-if="mostrarModalConfirmacion" class="modal-overlay">
        <div class="modal-content confirmacion-dialog">
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar al usuario <strong>{{ usuarioAEliminar?.Nombre }} 
                 {{ usuarioAEliminar?.Apellido_Paterno }}</strong> (ID: {{ usuarioAEliminar?.ID_Usuario }})?</p>
            <p class="advertencia-eliminacion">Esta acción no se puede deshacer.</p>
            <div class="modal-actions">
                <button @click="ejecutarEliminacion" class="btn-eliminar-confirm" :disabled="cargandoEliminacion">
                    <span v-if="cargandoEliminacion" class="spinner-btn"></span>
                    {{ cargandoEliminacion ? 'Eliminando...' : 'Sí, Eliminar' }}
                </button>
                <button @click="cancelarEliminacion" class="btn-cancelar" :disabled="cargandoEliminacion">Cancelar</button>
            </div>
             <div v-if="errorEliminacion" class="error-message-form">{{ errorEliminacion }}</div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import axios from '@/axios';
import TablaUsuarios from '@/components/TablaUsuarios.vue';
import FormularioUsuario from '@/components/FormularioUsuario.vue';
import BarraBusqueda from '@/components/BarraBusqueda.vue';

const listaUsuarios = ref([]);
const cargandoGlobal = ref(false);
const cargandoFormulario = ref(false);
const cargandoEliminacion = ref(false);

const errorApi = ref(null);
const errorFormulario = ref(null);
const errorEliminacion = ref(null);

const mostrarModal = ref(false);
const esEdicion = ref(false);
const usuarioActual = reactive({
  ID_Usuario: null,
  Nombre: '',
  Apellido_Paterno: '',
  Apellido_Materno: '',
  Email: '',
  Rol: 'operador',
  Contrasena: ''
});

const mostrarModalConfirmacion = ref(false);
const usuarioAEliminar = ref(null);

const mostrarMensajeExitoGlobal = ref(false);
const mensajeExitoGlobalTexto = ref('');

const searchTermUsuario = ref('');

const filteredUsuarios = computed(() => {
  if (!searchTermUsuario.value) {
    return listaUsuarios.value;
  }
  const lowerSearchTerm = searchTermUsuario.value.toLowerCase().trim();
  return listaUsuarios.value.filter(usuario => {
    const nombreCompleto = `${usuario.Nombre || ''} ${usuario.Apellido_Paterno || ''} ${usuario.Apellido_Materno || ''}`.toLowerCase();
    return (
      (usuario.ID_Usuario?.toString().includes(lowerSearchTerm)) ||
      (nombreCompleto.includes(lowerSearchTerm)) ||
      (usuario.Email && usuario.Email.toLowerCase().includes(lowerSearchTerm)) ||
      (usuario.Rol && usuario.Rol.toLowerCase().includes(lowerSearchTerm))
    );
  });
});

const mostrarMensajeExitoTemporal = (mensaje) => {
  mensajeExitoGlobalTexto.value = mensaje;
  mostrarMensajeExitoGlobal.value = true;
  setTimeout(() => {
    mostrarMensajeExitoGlobal.value = false;
    mensajeExitoGlobalTexto.value = '';
  }, 2500);
};

const obtenerUsuariosAPI = async () => {
  cargandoGlobal.value = true;
  errorApi.value = null;
  try {
    const { data } = await axios.get('/usuarios');
    listaUsuarios.value = data;
  } catch (error) {
    errorApi.value = error.response?.data?.mensaje || 'Error al cargar la lista de usuarios.';
  } finally {
    cargandoGlobal.value = false;
  }
};

onMounted(obtenerUsuariosAPI);

const limpiarFormularioReactivo = () => {
  Object.assign(usuarioActual, {
    ID_Usuario: null, Nombre: '', Apellido_Paterno: '', Apellido_Materno: '',
    Email: '', Rol: 'operador', Contrasena: ''
  });
  errorFormulario.value = null;
};

const abrirModalCrear = () => {
  limpiarFormularioReactivo();
  esEdicion.value = false;
  mostrarModal.value = true;
};

const abrirModalEditar = (usuario) => {
  esEdicion.value = true;
  Object.keys(usuarioActual).forEach(key => {
    if (key !== 'Contrasena') {
      usuarioActual[key] = usuario[key] !== undefined ? usuario[key] : '';
    } else {
      usuarioActual.Contrasena = '';
    }
  });
   usuarioActual.ID_Usuario = usuario.ID_Usuario;
  errorFormulario.value = null;
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
};

const procesarGuardadoUsuario = async (datosUsuarioDesdeFormulario) => {
  errorFormulario.value = null;
  cargandoFormulario.value = true;
  
  try {
    const payload = { ...datosUsuarioDesdeFormulario };
    let mensajeConfirmacion = '';

    if (esEdicion.value) {
      await axios.put(`/usuarios/${payload.ID_Usuario}`, payload);
      mensajeConfirmacion = '¡Usuario actualizado correctamente!';
    } else {
      await axios.post('/usuarios', payload);
      mensajeConfirmacion = '¡Usuario creado correctamente!';
    }
    
    cerrarModal();
    mostrarMensajeExitoTemporal(mensajeConfirmacion);
    await obtenerUsuariosAPI();

  } catch (error) {
    errorFormulario.value = error.response?.data?.mensaje || (esEdicion.value ? 'Error al actualizar el usuario.' : 'Error al crear el usuario.');
  } finally {
    cargandoFormulario.value = false;
  }
};

const confirmarEliminacion = (id) => {
  const user = listaUsuarios.value.find(u => u.ID_Usuario === id);
  if (user) {
    usuarioAEliminar.value = {...user};
    mostrarModalConfirmacion.value = true;
    errorEliminacion.value = null;
  }
};

const cancelarEliminacion = () => {
  mostrarModalConfirmacion.value = false;
  usuarioAEliminar.value = null;
  errorEliminacion.value = null;
};

const ejecutarEliminacion = async () => {
  if (!usuarioAEliminar.value) return;
  cargandoEliminacion.value = true;
  errorEliminacion.value = null;
  try {
    await axios.delete(`/usuarios/${usuarioAEliminar.value.ID_Usuario}`);
    cancelarEliminacion();
    mostrarMensajeExitoTemporal('¡Usuario eliminado correctamente!');
    await obtenerUsuariosAPI();
  } catch (error) {
    errorEliminacion.value = error.response?.data?.mensaje || 'Error al eliminar el usuario.';
  } finally {
    cargandoEliminacion.value = false;
  }
};
</script>

<style scoped>
.toolbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap; 
  gap: 15px;
}

.search-wrapper {
  flex-grow: 1;
  max-width: 450px;
  min-width: 250px;
}

.btn-crear {
  flex-shrink: 0; 
}

.no-datos {
  text-align: center;
  padding: 20px;
  color: #777;
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 5px;
  margin-top: 15px;
}

.gestion-container {
  padding: 25px;
  max-width: 1000px;
  margin: 2rem auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.gestion-container h1 {
  color: #333;
  text-align: center;
  margin-bottom: 10px;
}
.subtitulo {
    text-align: center;
    color: #666;
    margin-bottom: 25px;
    font-size: 0.95em;
}

.btn-crear {
  background-color: #28a745;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-crear:hover {
  background-color: #218838;
}
.btn-crear:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 25px 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.error-message-api,
.error-message-form {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #555;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #4e4b4c;
  animation: spin 1s ease infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.confirmacion-dialog h3 {
    margin-top: 0;
    color: #dc3545;
}
.confirmacion-dialog p {
    margin-bottom: 10px;
}
.advertencia-eliminacion {
    font-size: 0.9em;
    color: #721c24;
    font-style: italic;
    margin-bottom: 15px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.btn-eliminar-confirm, .btn-cancelar {
  padding: 10px 18px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 500;
  min-width: 100px;
}
.btn-eliminar-confirm {
    background-color: #dc3545;
    color: white;
}
.btn-eliminar-confirm:hover:not(:disabled) {
    background-color: #c82333;
}
.btn-cancelar {
  background-color: #6c757d;
  color: white;
}
.btn-cancelar:hover:not(:disabled) {
  background-color: #5a6268;
}
.btn-eliminar-confirm:disabled, .btn-cancelar:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
    opacity: 0.7;
}
.spinner-btn {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  margin-right: 5px;
  vertical-align: middle;
}
.mensaje-exito-global {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #28a745;
  color: white;
  padding: 12px 25px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 2000;
  font-size: 1.1em;
  display: flex;
  align-items: center;
  gap: 10px;
}
.icono-exito {
  font-size: 1.3em;
  font-weight: bold;
}
</style>
