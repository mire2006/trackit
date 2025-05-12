<template>
  <div class="gestion-container">
    <h1>Tipos de Bomba</h1>
    <p class="subtitulo">Administra las marcas y modelos de las bombas.</p>

    <div class="toolbar-container">
      <button @click="abrirModalCrear" class="btn-crear" :disabled="cargandoGlobal">
        Crear Nuevo Tipo de Bomba
      </button>
      <div class="search-wrapper">
        <BarraBusqueda
          v-model="searchTermTipoBomba"
          placeholder="Buscar por Marca, Modelo, Descripción..."
          :disabled="cargandoGlobal"
        />
      </div>
    </div>

    <div v-if="cargandoGlobal" class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando tipos de bomba...</p>
    </div>

    <div v-if="errorApi" class="error-message-api">
      {{ errorApi }}
    </div>

    <div v-if="mostrarMensajeExitoGlobal" class="mensaje-exito-global">
      <span class="icono-exito">✓</span> {{ mensajeExitoGlobalTexto }}
    </div>

    <TablaTiposBomba
      v-if="!cargandoGlobal && !errorApi"
      :tipos-bomba="tiposBombaPaginados"
      @editar="abrirModalEditar"
      @eliminar="confirmarEliminacion"
    />

    <div v-if="!cargandoGlobal && !errorApi && totalPaginas > 0" class="controles-paginacion">
      <button @click="cambiarPagina(1)" :disabled="paginaActual === 1" class="btn-paginacion btn-extremo">
        « Primera
      </button>
      <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1" class="btn-paginacion">
        ‹ Anterior
      </button>
      <span class="info-pagina">
        Página {{ paginaActual }} de {{ totalPaginas }} (Total: {{ filteredTiposBomba.length }} tipos)
      </span>
      <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas" class="btn-paginacion">
        Siguiente ›
      </button>
      <button @click="cambiarPagina(totalPaginas)" :disabled="paginaActual === totalPaginas" class="btn-paginacion btn-extremo">
        Última »
      </button>
    </div>

    <div v-if="!cargandoGlobal && !errorApi && filteredTiposBomba.length === 0 && listaTiposBomba.length > 0 && searchTermTipoBomba" class="no-datos">
      <p>No se encontraron tipos de bomba que coincidan con "{{ searchTermTipoBomba }}".</p>
    </div>
     <div v-if="!cargandoGlobal && !errorApi && listaTiposBomba.length === 0 && !searchTermTipoBomba" class="no-datos">
        <p>No hay tipos de bomba registrados todavía. ¡Crea el primero!</p>
    </div>

    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-content modal-tipo-bomba">
        <h2>{{ esEdicion ? 'Editar Tipo de Bomba' : 'Crear Nuevo Tipo de Bomba' }}</h2>
        <FormularioTipoBomba
          :tipo-bomba-data="tipoBombaActual"
          :es-edicion="esEdicion"
          :cargando="cargandoFormulario"
          :error-formulario-prop="errorFormulario"
          @guardar="procesarGuardadoTipoBomba"
          @cancelar="cerrarModal"
        />
      </div>
    </div>

    <div v-if="mostrarModalConfirmacion" class="modal-overlay">
        <div class="modal-content confirmacion-dialog">
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar el tipo de bomba <strong>{{ tipoBombaAEliminar?.Marca }} - 
                  {{ tipoBombaAEliminar?.Modelo }}</strong> (ID: {{ tipoBombaAEliminar?.ID_Tipo_Bomba }})?</p>
            <p class="advertencia-eliminacion">Esta acción no se puede deshacer. Si este tipo de bomba está siendo 
                  utilizado por alguna bomba registrada, no se podrá eliminar.</p>
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
import { ref, onMounted, reactive, computed, watch } from 'vue';
import axios from '@/axios';
import TablaTiposBomba from '@/components/TablaTiposBomba.vue';
import FormularioTipoBomba from '@/components/FormularioTipoBomba.vue';
import BarraBusqueda from '@/components/BarraBusqueda.vue';

const listaTiposBomba = ref([]);
const cargandoGlobal = ref(false);
const cargandoFormulario = ref(false);
const cargandoEliminacion = ref(false);

const errorApi = ref(null);
const errorFormulario = ref(null);
const errorEliminacion = ref(null);

const mostrarModal = ref(false);
const esEdicion = ref(false);
const tipoBombaActual = reactive({
  ID_Tipo_Bomba: null,
  Marca: '',
  Modelo: '',
  Descripcion_Tecnica: ''
});

const mostrarModalConfirmacion = ref(false);
const tipoBombaAEliminar = ref(null);

const mostrarMensajeExitoGlobal = ref(false);
const mensajeExitoGlobalTexto = ref('');

const searchTermTipoBomba = ref('');

const paginaActual = ref(1);
const itemsPorPagina = ref(10);

const filteredTiposBomba = computed(() => {
  if (!searchTermTipoBomba.value) {
    return listaTiposBomba.value;
  }
  const lowerSearchTerm = searchTermTipoBomba.value.toLowerCase().trim();
  return listaTiposBomba.value.filter(tipo => {
    return (
      (tipo.Marca && tipo.Marca.toLowerCase().includes(lowerSearchTerm)) ||
      (tipo.Modelo && tipo.Modelo.toLowerCase().includes(lowerSearchTerm)) ||
      (tipo.Descripcion_Tecnica && tipo.Descripcion_Tecnica.toLowerCase().includes(lowerSearchTerm))
    );
  });
});

const tiposBombaPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina.value;
  const fin = inicio + itemsPorPagina.value;
  return filteredTiposBomba.value.slice(inicio, fin);
});

const totalPaginas = computed(() => {
  if(!filteredTiposBomba.value) return 0;
  return Math.ceil(filteredTiposBomba.value.length / itemsPorPagina.value);
});

const cambiarPagina = (nuevaPagina) => {
  if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas.value) {
    paginaActual.value = nuevaPagina;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

watch(searchTermTipoBomba, () => {
  paginaActual.value = 1;
});

const mostrarMensajeExitoTemporal = (mensaje) => {
  mensajeExitoGlobalTexto.value = mensaje;
  mostrarMensajeExitoGlobal.value = true;
  setTimeout(() => {
    mostrarMensajeExitoGlobal.value = false;
    mensajeExitoGlobalTexto.value = '';
  }, 2500);
};

const obtenerTiposBombaAPI = async () => {
  cargandoGlobal.value = true;
  errorApi.value = null;
  paginaActual.value = 1;
  try {
    const { data } = await axios.get('/api/tipos_bomba');
    listaTiposBomba.value = data;
  } catch (error) {
    console.error("Error al cargar tipos de bomba:", error);
    errorApi.value = error.response?.data?.mensaje || 'Error al cargar la lista de tipos de bomba.';
  } finally {
    cargandoGlobal.value = false;
  }
};

onMounted(obtenerTiposBombaAPI);

const limpiarFormularioReactivo = () => {
  Object.assign(tipoBombaActual, {
    ID_Tipo_Bomba: null, Marca: '', Modelo: '', Descripcion_Tecnica: ''
  });
  errorFormulario.value = null;
};

const abrirModalCrear = () => {
  limpiarFormularioReactivo();
  esEdicion.value = false;
  mostrarModal.value = true;
};

const abrirModalEditar = (tipo) => {
  esEdicion.value = true;
  Object.assign(tipoBombaActual, tipo);
  errorFormulario.value = null;
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
};

const procesarGuardadoTipoBomba = async (datosDesdeFormulario) => {
  errorFormulario.value = null;
  cargandoFormulario.value = true;
  
  try {
    const payload = { ...datosDesdeFormulario };
    let mensajeConfirmacion = '';

    if (esEdicion.value) {
      await axios.put(`/api/tipos_bomba/${payload.ID_Tipo_Bomba}`, payload);
      mensajeConfirmacion = '¡Tipo de bomba actualizado correctamente!';
    } else {
      await axios.post('/api/tipos_bomba', payload);
      mensajeConfirmacion = '¡Tipo de bomba creado correctamente!';
    }
    
    cerrarModal();
    mostrarMensajeExitoTemporal(mensajeConfirmacion);
    await obtenerTiposBombaAPI();

  } catch (error) {
    console.error("Error al guardar tipo de bomba:", error);
    errorFormulario.value = error.response?.data?.mensaje || (esEdicion.value ? 'Error al actualizar.' : 'Error al crear.');
  } finally {
    cargandoFormulario.value = false;
  }
};

const confirmarEliminacion = (id) => {
  const tipo = listaTiposBomba.value.find(t => t.ID_Tipo_Bomba === id);
  if (tipo) {
    tipoBombaAEliminar.value = {...tipo};
    mostrarModalConfirmacion.value = true;
    errorEliminacion.value = null;
  }
};

const cancelarEliminacion = () => {
  mostrarModalConfirmacion.value = false;
  tipoBombaAEliminar.value = null;
  errorEliminacion.value = null;
};

const ejecutarEliminacion = async () => {
  if (!tipoBombaAEliminar.value) return;
  cargandoEliminacion.value = true;
  errorEliminacion.value = null;
  try {
    await axios.delete(`/api/tipos_bomba/${tipoBombaAEliminar.value.ID_Tipo_Bomba}`);
    cancelarEliminacion();
    mostrarMensajeExitoTemporal('¡Tipo de bomba eliminado correctamente!');
    await obtenerTiposBombaAPI();
  } catch (error) {
    console.error("Error al eliminar tipo de bomba:", error);
    errorEliminacion.value = error.response?.data?.mensaje || 'Error al eliminar. Verifique si está en uso.';
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
  max-height: 90vh;
  overflow-y: auto;
}
.modal-tipo-bomba {
    max-width: 650px;
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
.btn-eliminar-confirm, .btn-cancelar, .btn-guardar {
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
.btn-guardar {
  background-color: #007bff;
  color: white;
}
.btn-guardar:hover:not(:disabled) {
  background-color: #0056b3;
}
.btn-eliminar-confirm:disabled, .btn-cancelar:disabled, .btn-guardar:disabled {
    background-color: #adb5bd;
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
  background-color: #17a2b8;
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

.controles-paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 25px;
  margin-bottom: 15px;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-paginacion {
  padding: 8px 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
}

.btn-paginacion:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn-paginacion:disabled {
  background-color: #adb5bd;
  color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-extremo {
    background-color: #545b62;
}
.btn-extremo:hover:not(:disabled) {
    background-color: #42474c;
}


.info-pagina {
  font-size: 0.95em;
  color: #495057;
  margin: 0 10px;
}

</style>
