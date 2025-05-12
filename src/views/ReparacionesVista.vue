<template>
  <div class="gestion-container">
    <h1>Gestión de Reparaciones</h1>
    <p class="subtitulo">Registra, visualiza y administra las reparaciones de las bombas.</p>

    <div class="toolbar-container">
      <button @click="abrirModalCrearReparacion" class="btn-crear" :disabled="cargandoGlobal">
        Registrar nueva reparación
      </button>
      <div class="search-wrapper">
        <BarraBusqueda
          v-model="searchTermReparacion"
          placeholder="Buscar por ID Rep, Fecha, ID Bomba, Modelo, Servicio..."
          :disabled="cargandoGlobal"
        />
      </div>
    </div>

    <div v-if="cargandoGlobal" class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando reparaciones...</p>
    </div>

    <div v-if="errorApi" class="error-message-api"> {{ errorApi }} </div>

    <div v-if="mostrarMensajeExitoGlobal" class="mensaje-exito-global">
      <span class="icono-exito">✓</span> {{ mensajeExitoGlobalTexto }}
    </div>

    <TablaReparaciones
      v-if="!cargandoGlobal && !errorApi"
      :reparaciones="reparacionesPaginadas"
      @editar="abrirModalEditarReparacion"
      @eliminar="confirmarEliminacionReparacion"
      @generar-informe="abrirModalInforme"
    />

    <div v-if="!cargandoGlobal && !errorApi && totalPaginas > 0" class="controles-paginacion">
      <button @click="cambiarPagina(1)" :disabled="paginaActual === 1" class="btn-paginacion btn-extremo">
        « Primera
      </button>
      <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1" class="btn-paginacion">
        ‹ Anterior
      </button>
      
      <span class="info-pagina">
        Página {{ paginaActual }} de {{ totalPaginas }} (Total: {{ filteredReparaciones.length }} reparaciones)
      </span>
      
      <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas" class="btn-paginacion">
        Siguiente ›
      </button>
      <button @click="cambiarPagina(totalPaginas)" :disabled="paginaActual === totalPaginas" class="btn-paginacion btn-extremo">
        Última »
      </button>
    </div>
    
    <div v-if="!cargandoGlobal && !errorApi && filteredReparaciones.length === 0 && listaReparaciones.length > 0 && searchTermReparacion" class="no-datos">
      <p>No se encontraron reparaciones que coincidan con "{{ searchTermReparacion }}".</p>
    </div>
     <div v-if="!cargandoGlobal && !errorApi && listaReparaciones.length === 0 && !searchTermReparacion" class="no-datos">
      <p>No hay reparaciones registradas todavía. ¡Crea la primera!</p>
    </div>

    <div v-if="mostrarModalReparacion" class="modal-overlay">
      <div class="modal-content modal-reparacion">
        <FormularioReparacion
          :reparacion-para-editar="reparacionSeleccionadaParaForm"
          @reparacion-guardada="manejarReparacionGuardada"
          @cancelado="cerrarModalReparacion"
        />
      </div>
    </div>

    <div v-if="mostrarModalConfirmacionReparacion" class="modal-overlay">
      <div class="modal-content confirmacion-dialog">
        <h3>Confirmar Eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar la reparación ID: <strong>{{ reparacionAEliminar?.ID_Reparacion }}</strong>?</p>
        <p class="advertencia-eliminacion">Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <button @click="ejecutarEliminacionReparacion" class="btn-eliminar-confirm" :disabled="cargandoEliminacionReparacion">
            <span v-if="cargandoEliminacionReparacion" class="spinner-btn"></span>
            {{ cargandoEliminacionReparacion ? 'Eliminando...' : 'Sí, Eliminar' }}
          </button>
          <button @click="cancelarEliminacionReparacion" class="btn-cancelar" :disabled="cargandoEliminacionReparacion">Cancelar</button>
        </div>
        <div v-if="errorEliminacionReparacion" class="error-message-form">{{ errorEliminacionReparacion }}</div>
      </div>
    </div>

    <InformeReparacionesModal
      v-if="mostrarModalInforme && bombaIdParaInformeSeleccionada"
      :bomba-id-para-informe="bombaIdParaInformeSeleccionada"
      @cerrar="cerrarModalInforme"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from '@/axios';
import TablaReparaciones from '@/components/TablaReparaciones.vue';
import FormularioReparacion from '@/components/FormularioReparacion.vue';
import BarraBusqueda from '@/components/BarraBusqueda.vue';
import InformeReparacionesModal from '@/components/InformeReparacionesModal.vue';

const listaReparaciones = ref([]);
const reparacionSeleccionadaParaForm = ref(null);
const mostrarModalReparacion = ref(false);
const esEdicionReparacion = ref(false);

const mostrarModalConfirmacionReparacion = ref(false);
const reparacionAEliminar = ref(null);
const cargandoEliminacionReparacion = ref(false);
const errorEliminacionReparacion = ref(null);

const cargandoGlobal = ref(false);
const errorApi = ref(null);
const mostrarMensajeExitoGlobal = ref(false);
const mensajeExitoGlobalTexto = ref('');

const searchTermReparacion = ref('');

const mostrarModalInforme = ref(false);
const bombaIdParaInformeSeleccionada = ref(null);

const paginaActual = ref(1);
const itemsPorPagina = ref(10);

const formatearFechaParaBusqueda = (fechaISO) => {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

const filteredReparaciones = computed(() => {
  if (!searchTermReparacion.value) {
    return listaReparaciones.value;
  }
  const lowerSearchTerm = searchTermReparacion.value.toLowerCase().trim();
  return listaReparaciones.value.filter(rep => {
    const serviciosNombres = rep.Servicios && Array.isArray(rep.Servicios) ? rep.Servicios.map(s => s.Nombre ? s.Nombre.toLowerCase() : '').join(' ') : '';
    return (
      (rep.ID_Reparacion?.toString().includes(lowerSearchTerm)) ||
      (formatearFechaParaBusqueda(rep.Fecha).includes(lowerSearchTerm)) ||
      (rep.ID_Bomba?.toString().includes(lowerSearchTerm)) ||
      (rep.BombaMarca && rep.BombaMarca.toLowerCase().includes(lowerSearchTerm)) ||
      (rep.BombaModelo && rep.BombaModelo.toLowerCase().includes(lowerSearchTerm)) ||
      (rep.NombreClienteBomba && rep.NombreClienteBomba.toLowerCase().includes(lowerSearchTerm)) ||
      (rep.Detalles && rep.Detalles.toLowerCase().includes(lowerSearchTerm)) ||
      (serviciosNombres.includes(lowerSearchTerm)) ||
      (rep.UsuarioEmail && rep.UsuarioEmail.toLowerCase().includes(lowerSearchTerm))
    );
  });
});

const reparacionesPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina.value;
  const fin = inicio + itemsPorPagina.value;
  return filteredReparaciones.value.slice(inicio, fin);
});

const totalPaginas = computed(() => {
  if (!filteredReparaciones.value) return 0;
  return Math.ceil(filteredReparaciones.value.length / itemsPorPagina.value);
});

const cambiarPagina = (nuevaPagina) => {
  if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas.value) {
    paginaActual.value = nuevaPagina;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

watch(searchTermReparacion, () => {
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

const obtenerReparacionesAPI = async () => {
  cargandoGlobal.value = true;
  errorApi.value = null;
  paginaActual.value = 1; 
  try {
    const { data } = await axios.get('/api/reparaciones');
    listaReparaciones.value = data;
  } catch (error) {
    console.error("Error al cargar reparaciones:", error);
    errorApi.value = error.response?.data?.mensaje || 'Error al cargar la lista de reparaciones.';
  } finally {
    cargandoGlobal.value = false;
  }
};

onMounted(async () => {
  await obtenerReparacionesAPI();
});

const abrirModalCrearReparacion = () => {
  esEdicionReparacion.value = false;
  reparacionSeleccionadaParaForm.value = null; 
  mostrarModalReparacion.value = true;
};

const abrirModalEditarReparacion = (reparacion) => {
  esEdicionReparacion.value = true;
  reparacionSeleccionadaParaForm.value = { ...reparacion }; 
  mostrarModalReparacion.value = true;
};

const cerrarModalReparacion = () => {
  mostrarModalReparacion.value = false;
  reparacionSeleccionadaParaForm.value = null; 
};

const manejarReparacionGuardada = async () => {
  cerrarModalReparacion();
  mostrarMensajeExitoTemporal(
    esEdicionReparacion.value ? '¡Reparación actualizada correctamente!' : '¡Reparación creada correctamente!'
  );
  await obtenerReparacionesAPI();
};

const confirmarEliminacionReparacion = (id) => {
  const reparacion = listaReparaciones.value.find(r => r.ID_Reparacion === id);
  if (reparacion) {
    reparacionAEliminar.value = {...reparacion};
    mostrarModalConfirmacionReparacion.value = true;
    errorEliminacionReparacion.value = null;
  }
};

const cancelarEliminacionReparacion = () => {
  mostrarModalConfirmacionReparacion.value = false;
  reparacionAEliminar.value = null;
  errorEliminacionReparacion.value = null;
};

const ejecutarEliminacionReparacion = async () => {
  if (!reparacionAEliminar.value) return;
  cargandoEliminacionReparacion.value = true;
  errorEliminacionReparacion.value = null;
  try {
    await axios.delete(`/api/reparaciones/${reparacionAEliminar.value.ID_Reparacion}`);
    cancelarEliminacionReparacion();
    mostrarMensajeExitoTemporal('¡Reparación eliminada correctamente!');
    await obtenerReparacionesAPI();
  } catch (error) {
    console.error("Error al eliminar reparacion:", error);
    errorEliminacionReparacion.value = error.response?.data?.mensaje || 'Error al eliminar la reparación.';
  } finally {
    cargandoEliminacionReparacion.value = false;
  }
};

const abrirModalInforme = (reparacion) => {
  if (reparacion && reparacion.ID_Bomba) {
    bombaIdParaInformeSeleccionada.value = reparacion.ID_Bomba;
    mostrarModalInforme.value = true;
  } else {
    console.error("No se proporcionó ID de bomba para el informe o la reparación es inválida.");
    mostrarMensajeExitoTemporal("Error: No se pudo obtener la información de la bomba para el informe.");
  }
};

const cerrarModalInforme = () => {
  mostrarModalInforme.value = false;
  bombaIdParaInformeSeleccionada.value = null;
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
  max-width: 1200px;
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
.modal-reparacion {
    max-width: 750px;
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

.btn-eliminar-confirm:disabled, .btn-cancelar:disabled {
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
  background-color: #ffc107; 
  color: #212529;
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

.tabla-trackit .btn-informe {
  background-color: #17a2b8;
  color: white;
  margin-left: 5px;
}
.tabla-trackit .btn-informe:hover {
  background-color: #138496;
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
