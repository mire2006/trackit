<template>
  <div class="gestion-container">
    <h1>Gestión de Bombas</h1>
    <p class="subtitulo">Asocia bombas a clientes y tipos, visualiza y gestiona sus datos.</p>

    <div class="toolbar-container">
      <button @click="abrirModalCrearBomba" class="btn-crear" :disabled="cargandoGlobal || cargandoDependencias">
        Crear Nueva Bomba
      </button>
      <div class="search-wrapper">
        <BarraBusqueda
          v-model="searchTermBomba"
          placeholder="Buscar por ID, Cliente, Marca, Modelo, Circuito..."
          :disabled="cargandoGlobal || cargandoDependencias"
        />
      </div>
    </div>

    <div v-if="cargandoGlobal || cargandoDependencias" class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>

    <div v-if="errorApi" class="error-message-api"> {{ errorApi }} </div>
    <div v-if="errorDependencias && !errorApi" class="error-message-api"> {{ errorDependencias }} </div>

    <div v-if="mostrarMensajeExitoGlobal" class="mensaje-exito-global">
      <span class="icono-exito">✓</span> {{ mensajeExitoGlobalTexto }}
    </div>

    <TablaBombas
      v-if="!cargandoGlobal && !errorApi && !cargandoDependencias && !errorDependencias"
      :bombas="bombasPaginadas"
      @editar="abrirModalEditarBomba"
      @eliminar="confirmarEliminacionBomba"
    />

    <div v-if="!cargandoGlobal && !errorApi && !cargandoDependencias && !errorDependencias && totalPaginas > 0" class="controles-paginacion">
      <button @click="cambiarPagina(1)" :disabled="paginaActual === 1" class="btn-paginacion btn-extremo">
        « Primera
      </button>
      <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1" class="btn-paginacion">
        ‹ Anterior
      </button>
      <span class="info-pagina">
        Página {{ paginaActual }} de {{ totalPaginas }} (Total: {{ filteredBombas.length }} bombas)
      </span>
      <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas" class="btn-paginacion">
        Siguiente ›
      </button>
      <button @click="cambiarPagina(totalPaginas)" :disabled="paginaActual === totalPaginas" class="btn-paginacion btn-extremo">
        Última »
      </button>
    </div>

    <div v-if="!cargandoGlobal && !errorApi && !cargandoDependencias && !errorDependencias && filteredBombas.length === 0 && listaBombas.length > 0 && searchTermBomba" class="no-datos">
      <p>No se encontraron bombas que coincidan con "{{ searchTermBomba }}".</p>
    </div>
     <div v-if="!cargandoGlobal && !errorApi && !cargandoDependencias && !errorDependencias && listaBombas.length === 0 && !searchTermBomba" class="no-datos">
        <p>No hay bombas registradas todavía. ¡Crea la primera!</p>
    </div>


    <div v-if="mostrarModalBomba" class="modal-overlay">
      <div class="modal-content modal-bomba">
        <h2>{{ esEdicionBomba ? 'Editar Bomba' : 'Crear Nueva Bomba' }}</h2>
        <FormularioBomba
          :bomba-data="bombaActual"
          :es-edicion="esEdicionBomba"
          :cargando="cargandoFormularioBomba"
          :error-formulario-prop="errorFormularioBomba"
          :lista-clientes="listaClientesParaForm"
          :lista-tipos-bomba="listaTiposBombaParaForm"
          :puede-crear-tipos="puedeGestionarTipos" 
          @guardar="procesarGuardadoBomba"
          @cancelar="cerrarModalBomba"
          @solicitar-crear-tipo-bomba="abrirModalCrearTipoBombaRapido"
        />
      </div>
    </div>

    <div v-if="mostrarModalTipoBombaRapido" class="modal-overlay modal-overlay-tipo-bomba">
      <div class="modal-content modal-tipo-bomba-rapido">
        <h2>Crear Nuevo Tipo de Bomba</h2>
        <FormularioTipoBomba
          :tipo-bomba-data="tipoBombaRapidoActual"
          :es-edicion="false" 
          :cargando="cargandoFormularioTipoBombaRapido"
          :error-formulario-prop="errorFormularioTipoBombaRapido"
          @guardar="procesarGuardadoTipoBombaRapido"
          @cancelar="cerrarModalTipoBombaRapido"
        />
      </div>
    </div>

    <div v-if="mostrarModalConfirmacionBomba" class="modal-overlay">
        <div class="modal-content confirmacion-dialog">
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar la bomba ID: <strong>{{ bombaAEliminar?.ID_Bomba }}</strong>
                (Circuito: {{ bombaAEliminar?.Circuito }}, Modelo: {{bombaAEliminar?.Marca}} - {{ bombaAEliminar?.Modelo }})?
            </p>
            <p class="advertencia-eliminacion">Esta acción no se puede deshacer y también eliminará 
              el código QR asociado. Si la bomba tiene reparaciones, no se podrá eliminar.</p>
            <div class="modal-actions">
                <button @click="ejecutarEliminacionBomba" class="btn-eliminar-confirm" :disabled="cargandoEliminacionBomba">
                  <span v-if="cargandoEliminacionBomba" class="spinner-btn"></span>
                  {{ cargandoEliminacionBomba ? 'Eliminando...' : 'Sí, Eliminar' }}
                </button>
                <button @click="cancelarEliminacionBomba" class="btn-cancelar" :disabled="cargandoEliminacionBomba">Cancelar</button>
            </div>
            <div v-if="errorEliminacionBomba" class="error-message-form">{{ errorEliminacionBomba }}</div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import axios from '@/axios';
import TablaBombas from '@/components/TablaBombas.vue';
import FormularioBomba from '@/components/FormularioBomba.vue';
import FormularioTipoBomba from '@/components/FormularioTipoBomba.vue';
import BarraBusqueda from '@/components/BarraBusqueda.vue';

const listaBombas = ref([]);
const bombaActual = reactive({ ID_Bomba: null, ID_Cliente: '', FK_ID_Tipo_Bomba: '', Circuito: '' });
const mostrarModalBomba = ref(false);
const esEdicionBomba = ref(false);
const cargandoFormularioBomba = ref(false);
const errorFormularioBomba = ref(null);
const mostrarModalConfirmacionBomba = ref(false);
const bombaAEliminar = ref(null);
const cargandoEliminacionBomba = ref(false);
const errorEliminacionBomba = ref(null);

const tipoBombaRapidoActual = reactive({ ID_Tipo_Bomba: null, Marca: '', Modelo: '', Descripcion_Tecnica: ''});
const mostrarModalTipoBombaRapido = ref(false);
const cargandoFormularioTipoBombaRapido = ref(false);
const errorFormularioTipoBombaRapido = ref(null);

const listaClientesParaForm = ref([]);
const listaTiposBombaParaForm = ref([]);
const cargandoGlobal = ref(false);
const cargandoDependencias = ref(false);
const errorApi = ref(null);
const errorDependencias = ref(null);
const mostrarMensajeExitoGlobal = ref(false);
const mensajeExitoGlobalTexto = ref('');

const userRole = ref(null);
const esAdmin = computed(() => userRole.value === 'administrador');
const esOperador = computed(() => userRole.value === 'operador');
const puedeGestionarTipos = computed(() => esAdmin.value || esOperador.value);

const searchTermBomba = ref('');

const paginaActual = ref(1);
const itemsPorPagina = ref(10);

const filteredBombas = computed(() => {
  if (!searchTermBomba.value) {
    return listaBombas.value;
  }
  const lowerSearchTerm = searchTermBomba.value.toLowerCase().trim();
  return listaBombas.value.filter(bomba => {
    return (
      (bomba.ID_Bomba?.toString().includes(lowerSearchTerm)) ||
      (bomba.Nombre_Cliente && bomba.Nombre_Cliente.toLowerCase().includes(lowerSearchTerm)) ||
      (bomba.Marca && bomba.Marca.toLowerCase().includes(lowerSearchTerm)) ||
      (bomba.Modelo && bomba.Modelo.toLowerCase().includes(lowerSearchTerm)) ||
      (bomba.Circuito && bomba.Circuito.toLowerCase().includes(lowerSearchTerm))
    );
  });
});

const bombasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina.value;
  const fin = inicio + itemsPorPagina.value;
  return filteredBombas.value.slice(inicio, fin);
});

const totalPaginas = computed(() => {
  if(!filteredBombas.value) return 0;
  return Math.ceil(filteredBombas.value.length / itemsPorPagina.value);
});

const cambiarPagina = (nuevaPagina) => {
  if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas.value) {
    paginaActual.value = nuevaPagina;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

watch(searchTermBomba, () => {
  paginaActual.value = 1;
});

const obtenerRolUsuarioActual = () => {
  const userDataString = localStorage.getItem('usuario');
  if (userDataString) {
    try {
      userRole.value = JSON.parse(userDataString).Rol;
    } catch (e) {
      console.error("Error al obtener rol del usuario:", e);
      userRole.value = null;
    }
  }
};

const mostrarMensajeExitoTemporal = (mensaje) => {
  mensajeExitoGlobalTexto.value = mensaje;
  mostrarMensajeExitoGlobal.value = true;
  setTimeout(() => {
    mostrarMensajeExitoGlobal.value = false;
    mensajeExitoGlobalTexto.value = '';
  }, 2500);
};

const obtenerBombasAPI = async () => {
  cargandoGlobal.value = true;
  errorApi.value = null;
  paginaActual.value = 1;
  try {
    const { data } = await axios.get('/bombas');
    listaBombas.value = data;
  } catch (error) {
    console.error("Error al cargar bombas:", error);
    errorApi.value = error.response?.data?.mensaje || 'Error al cargar la lista de bombas.';
  } finally {
    cargandoGlobal.value = false;
  }
};

const cargarDependenciasFormularioAPI = async () => {
  cargandoDependencias.value = true;
  errorDependencias.value = null;
  try {
    const [clientesRes, tiposBombaRes] = await Promise.all([
      axios.get('/clientes'),
      axios.get('/tipos_bomba')
    ]);
    listaClientesParaForm.value = clientesRes.data;
    listaTiposBombaParaForm.value = tiposBombaRes.data;
  } catch (error) {
    console.error("Error cargando dependencias para formulario de bombas:", error);
    errorDependencias.value = 'No se pudieron cargar los clientes o tipos de bomba para el formulario.';
  } finally {
    cargandoDependencias.value = false;
  }
};

onMounted(async () => {
  obtenerRolUsuarioActual();
  await obtenerBombasAPI();
  await cargarDependenciasFormularioAPI();
});

const limpiarFormularioBomba = () => {
  Object.assign(bombaActual, { ID_Bomba: null, ID_Cliente: '', FK_ID_Tipo_Bomba: '', Circuito: '' });
  errorFormularioBomba.value = null;
};

const abrirModalCrearBomba = () => {
  if (listaClientesParaForm.value.length === 0) {
    alert('No hay clientes registrados. Por favor, cree un cliente primero.');
    if (!cargandoDependencias.value) cargarDependenciasFormularioAPI();
    return;
  }
  limpiarFormularioBomba();
  esEdicionBomba.value = false;
  mostrarModalBomba.value = true;
};

const abrirModalEditarBomba = (bomba) => {
  esEdicionBomba.value = true;
  bombaActual.ID_Bomba = bomba.ID_Bomba;
  bombaActual.ID_Cliente = Number(bomba.ID_Cliente) || '';
  bombaActual.FK_ID_Tipo_Bomba = Number(bomba.FK_ID_Tipo_Bomba) || '';
  bombaActual.Circuito = bomba.Circuito || '';
  errorFormularioBomba.value = null;
  mostrarModalBomba.value = true;
};

const cerrarModalBomba = () => {
  mostrarModalBomba.value = false;
};

const procesarGuardadoBomba = async (datosBombaDesdeFormulario) => { 
  errorFormularioBomba.value = null;
  cargandoFormularioBomba.value = true;
  try {
    const payload = { ...datosBombaDesdeFormulario };
    let mensajeConfirmacion = '';
    if (esEdicionBomba.value) {
      await axios.put(`/bombas/${payload.ID_Bomba}`, payload);
      mensajeConfirmacion = '¡Bomba actualizada correctamente!';
    } else {
      await axios.post('/bombas', payload);
      mensajeConfirmacion = '¡Bomba creada correctamente!';
    }
    cerrarModalBomba();
    mostrarMensajeExitoTemporal(mensajeConfirmacion);
    await obtenerBombasAPI();
  } catch (error) {
    console.error("Error al guardar bomba:", error);
    errorFormularioBomba.value = error.response?.data?.mensaje || (esEdicionBomba.value ? 'Error al actualizar la bomba.' : 'Error al crear la bomba.');
  } finally {
    cargandoFormularioBomba.value = false;
  }
};

const confirmarEliminacionBomba = (id) => {
  const bomba = listaBombas.value.find(b => b.ID_Bomba === id);
  if (bomba) {
    bombaAEliminar.value = {...bomba};
    mostrarModalConfirmacionBomba.value = true;
    errorEliminacionBomba.value = null;
  }
};
const cancelarEliminacionBomba = () => {
  mostrarModalConfirmacionBomba.value = false;
  bombaAEliminar.value = null;
  errorEliminacionBomba.value = null;
};
const ejecutarEliminacionBomba = async () => {
  if (!bombaAEliminar.value) return;
  cargandoEliminacionBomba.value = true;
  errorEliminacionBomba.value = null;
  try {
    await axios.delete(`/bombas/${bombaAEliminar.value.ID_Bomba}`);
    cancelarEliminacionBomba();
    mostrarMensajeExitoTemporal('¡Bomba eliminada correctamente!');
    await obtenerBombasAPI();
  } catch (error) {
    console.error("Error al eliminar bomba:", error);
    errorEliminacionBomba.value = error.response?.data?.mensaje || 'Error al eliminar la bomba.';
  } finally {
    cargandoEliminacionBomba.value = false;
  }
};

const limpiarFormularioTipoBombaRapido = () => {
    Object.assign(tipoBombaRapidoActual, { ID_Tipo_Bomba: null, Marca: '', Modelo: '', Descripcion_Tecnica: ''});
    errorFormularioTipoBombaRapido.value = null;
};

const abrirModalCrearTipoBombaRapido = () => {
  limpiarFormularioTipoBombaRapido();
  mostrarModalTipoBombaRapido.value = true;
};

const cerrarModalTipoBombaRapido = () => {
  mostrarModalTipoBombaRapido.value = false;
};

const procesarGuardadoTipoBombaRapido = async (datosTipoBomba) => {
  errorFormularioTipoBombaRapido.value = null;
  cargandoFormularioTipoBombaRapido.value = true;
  try {
    const { data } = await axios.post('/tipos_bomba', datosTipoBomba);
    
    await cargarDependenciasFormularioAPI(); 
    
    if(data.tipo_bomba && data.tipo_bomba.ID_Tipo_Bomba) {
        bombaActual.FK_ID_Tipo_Bomba = data.tipo_bomba.ID_Tipo_Bomba;
    }
    cerrarModalTipoBombaRapido();
    mostrarMensajeExitoTemporal('¡Nuevo tipo de bomba creado exitosamente!');
  } catch (error) {
    console.error("Error al crear tipo de bomba rápido:", error);
    errorFormularioTipoBombaRapido.value = error.response?.data?.mensaje || 'Error al crear el tipo de bomba.';
  } finally {
    cargandoFormularioTipoBombaRapido.value = false;
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
.modal-overlay-tipo-bomba {
    z-index: 1005;
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

.modal-bomba {
    max-width: 700px; 
}
.modal-tipo-bomba-rapido {
    max-width: 550px; 
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

.btn-eliminar-confirm:disabled, 
.btn-cancelar:disabled, 
.btn-guardar:disabled {
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
