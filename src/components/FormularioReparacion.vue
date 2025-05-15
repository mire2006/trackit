<template>
  <div class="formulario-reparacion-container">
    <h3>{{ tituloFormulario }}</h3> <div v-if="mensajeError" class="error-message">{{ mensajeError }}</div> <div v-if="mensajeExito" class="success-message">{{ mensajeExito }}</div> <form @submit.prevent="guardarReparacion"> <div class="form-group">
        <label for="bomba-busqueda">Bomba:</label>
        <BusquedaBomba
          id="bomba-busqueda"
          v-model="formData.ID_Bomba"
          :opciones="bombasList" placeholderSelect="Seleccione o busque una bomba"
          placeholderInput="Buscar por ID, Marca, Modelo, Cliente..."
          :disabled="isLoading" />
        <p v-if="submitted && !formData.ID_Bomba" class="validation-error"> Debe seleccionar una bomba.
        </p>
      </div>

      <div class="form-group">
        <label for="fecha">Fecha:</label>
        <input type="date" id="fecha" v-model="formData.Fecha" required />
      </div>

      <div class="form-group">
        <label>Tipos de Servicio Realizados:</label>
        
        <div v-if="props.cargandoTiposServicioProp" class="loading-indicator-small">
          Cargando tipos de servicio...
        </div>
        <div v-else-if="props.errorTiposServicioProp" class="error-message">
          Error al cargar tipos de servicio: {{ props.errorTiposServicioProp }}
        </div>
        <div v-else-if="props.listaTiposServicioProp && props.listaTiposServicioProp.length > 0" class="checkbox-group">
          <div v-for="tipo in props.listaTiposServicioProp" :key="tipo.ID_Tipo_Servicio" class="checkbox-item">
            <input
              type="checkbox"
              :id="'tipo_' + tipo.ID_Tipo_Servicio"
              :value="tipo.ID_Tipo_Servicio"
              v-model="selectedTiposServicioIds" />
            <label :for="'tipo_' + tipo.ID_Tipo_Servicio">{{ tipo.Nombre }}</label>
          </div>
        </div>
        <p v-else-if="!props.cargandoTiposServicioProp && !props.errorTiposServicioProp">
          No hay tipos de servicio activos disponibles.
        </p>
        <p v-if="submitted && selectedTiposServicioIds && selectedTiposServicioIds.length === 0" class="validation-error">
          Debe seleccionar al menos un tipo de servicio.
        </p>
      </div>

      <div class="form-group">
        <label for="detalles">Detalles Adicionales:</label>
        <textarea id="detalles" v-model="formData.Detalles" rows="4"></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="isLoading" class="btn-guardar">
          {{ isLoading ? 'Guardando...' : (esEdicion ? 'Actualizar Reparación' : 'Crear Reparación') }} </button>
        <button type="button" @click="cancelar" class="btn-cancelar">Cancelar</button> </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import axios from '../axios';
import BusquedaBomba from './BusquedaBomba.vue';

const props = defineProps({
  reparacionParaEditar: {
    type: Object,
    default: null
  },
  listaTiposServicioProp: {
    type: Array,
    default: () => []
  },
  cargandoTiposServicioProp: {
    type: Boolean,
    default: false
  },
  errorTiposServicioProp: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['reparacionGuardada', 'cancelado']);

const formData = reactive({
  ID_Bomba: null,
  Fecha: new Date().toISOString().slice(0, 10),
  Detalles: '',
});
const selectedTiposServicioIds = ref([]);
const bombasList = ref([]);
const isLoading = ref(false);
const mensajeError = ref('');
const mensajeExito = ref('');
const submitted = ref(false);

const esEdicion = computed(() => !!props.reparacionParaEditar);
const tituloFormulario = computed(() => esEdicion.value ? 'Editar Reparación' : 'Registrar Nueva Reparación');

async function cargarDatosIniciales() {
  isLoading.value = true;
  mensajeError.value = '';
  try {
    const resBombas = await axios.get('/bombas');
    bombasList.value = resBombas.data;
    console.log('[FormularioReparacion] Bombas cargadas:', bombasList.value);

  } catch (error) {
    console.error('[FormularioReparacion] Error cargando datos iniciales (bombas):', error);
    mensajeError.value = 'Error al cargar la lista de bombas.';
    if (error.response && error.response.data && error.response.data.mensaje) {
        mensajeError.value += ` Detalle: ${error.response.data.mensaje}`;
    }
  } finally {
    isLoading.value = false;
  }
}

function poblarFormularioSiEdita() {
    if (esEdicion.value) {
      const reparacion = props.reparacionParaEditar;
      formData.ID_Bomba = reparacion.ID_Bomba;
      formData.Fecha = reparacion.Fecha ? new Date(reparacion.Fecha).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      formData.Detalles = reparacion.Detalles || '';
      selectedTiposServicioIds.value = reparacion.Servicios ? reparacion.Servicios.map(s => s.ID_Tipo_Servicio) : [];
    } else {
      formData.ID_Bomba = null;
      formData.Fecha = new Date().toISOString().slice(0, 10);
      formData.Detalles = '';
      selectedTiposServicioIds.value = [];
      submitted.value = false;
    }
}

async function guardarReparacion() {
  submitted.value = true;
  mensajeError.value = '';
  mensajeExito.value = '';

  if (!formData.ID_Bomba) {
    mensajeError.value = 'Debe seleccionar una bomba.';
    return;
  }
  if (selectedTiposServicioIds.value.length === 0) {
    mensajeError.value = 'Debe seleccionar al menos un tipo de servicio.';
    return;
  }
  if (!formData.Fecha) {
    mensajeError.value = 'Debe seleccionar una fecha.';
    return;
  }

  isLoading.value = true;

  let idUsuarioLogueado = null;
  try {
    const usuarioDataString = localStorage.getItem('usuario');
    if (usuarioDataString) {
      const usuarioData = JSON.parse(usuarioDataString);
      idUsuarioLogueado = usuarioData.ID_Usuario;
    }
  } catch(e) {
    console.error("[FormularioReparacion] Error obteniendo ID de usuario:", e);
    mensajeError.value = "Error obteniendo información del usuario. Intente iniciar sesión de nuevo.";
    isLoading.value = false;
    return;
  }

  if (!idUsuarioLogueado) {
    mensajeError.value = "No se pudo identificar al usuario. Intente iniciar sesión de nuevo.";
    isLoading.value = false;
    return;
  }

  const payload = {
    ID_Bomba: Number(formData.ID_Bomba),
    Fecha: formData.Fecha,
    Detalles: formData.Detalles,
    ID_Usuario: idUsuarioLogueado,
    tiposServicioIds: selectedTiposServicioIds.value
  };

  try {
    let response;
    if (esEdicion.value) {
      const idReparacion = props.reparacionParaEditar.ID_Reparacion;
      response = await axios.put(`/reparaciones/${idReparacion}`, payload);
      mensajeExito.value = 'Reparación actualizada exitosamente.';
    } else {
      response = await axios.post('/reparaciones', payload);
      mensajeExito.value = 'Reparación creada exitosamente.';
      formData.ID_Bomba = null;
      formData.Fecha = new Date().toISOString().slice(0, 10);
      formData.Detalles = '';
      selectedTiposServicioIds.value = [];
      submitted.value = false;
    }

    setTimeout(() => {
        emit('reparacionGuardada', response.data.reparacion);
    }, 1500);

  } catch (error) {
    console.error('[FormularioReparacion] Error al guardar reparación:', error);
    if (error.response && error.response.data && error.response.data.mensaje) {
      mensajeError.value = error.response.data.mensaje;
    } else {
      mensajeError.value = `Error al ${esEdicion.value ? 'actualizar' : 'crear'} la reparación. Verifique los datos e intente de nuevo.`;
    }
  } finally {
    isLoading.value = false;
  }
}

function cancelar() {
  emit('cancelado');
}

onMounted(() => {
  cargarDatosIniciales().then(() => {
      poblarFormularioSiEdita();
  });
});

watch(() => props.reparacionParaEditar, (newVal, oldVal) => {
  if (newVal !== oldVal || (newVal && !oldVal)) {
    if (bombasList.value.length === 0 && !isLoading.value) {
        cargarDatosIniciales().then(() => {
            poblarFormularioSiEdita();
        });
    } else if (!isLoading.value) {
        poblarFormularioSiEdita();
    }
  }
}, { immediate: true, deep: true });

</script>

<style scoped>
.formulario-reparacion-container {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  max-width: 700px;
  margin: 20px auto;
}

h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="date"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
}

.checkbox-group {
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  background-color: #fff;
}

.checkbox-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.checkbox-item input[type="checkbox"] {
    margin-right: 8px; 
    cursor: pointer;
}
.checkbox-item label {
    margin-bottom: 0; 
    font-weight: normal; 
    cursor: pointer;
}

.form-actions {
  margin-top: 20px;
  text-align: right;
}

.btn-guardar, .btn-cancelar {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-left: 10px;
}

.btn-guardar {
  background-color: #28a745; 
  color: white;
}
.btn-guardar:disabled {
    background-color: #aaa;
    cursor: not-allowed;
}

.btn-cancelar {
  background-color: #6c757d; 
  color: white;
}

.error-message, .validation-error {
  color: #dc3545;
  margin-bottom: 10px;
  font-size: 0.9em;
}

.success-message {
    color: #28a745;
    margin-bottom: 10px;
    font-weight: bold;
}
</style>
