<template>
  <div>
    <h1>Gestión de Reparaciones</h1>

    <button @click="abrirFormularioNuevo" v-if="!mostrarFormulario"> 
      Nueva Reparación
    </button>
     <button @click="cerrarFormulario" v-if="mostrarFormulario">
        Ocultar Formulario
     </button>


    <FormularioReparacion
      v-if="mostrarFormulario"
      :reparacionParaEditar="reparacionSeleccionada"
      @reparacionGuardada="manejarGuardado"
      @cancelado="cerrarFormulario"
    />

    <h2>Lista de Reparaciones</h2>
    <ul>
      <li v-for="reparacion in listaReparaciones" :key="reparacion.ID_Reparacion">
        Fecha: {{ reparacion.Fecha }} - Bomba: {{ reparacion.ID_Bomba }} 
        <button @click="editarReparacion(reparacion)">Editar</button> 
        {/* <button @click="eliminarReparacion(reparacion.ID_Reparacion)">Eliminar</button> */}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FormularioReparacion from '@/components/FormularioReparacion.vue';
import axios from '@/axios'; 

const mostrarFormulario = ref(false);
const reparacionSeleccionada = ref(null);
const listaReparaciones = ref([]);

async function cargarReparaciones() {
  try {
    const response = await axios.get('/api/reparaciones');
    listaReparaciones.value = response.data;
  } catch (error) {
    console.error("Error cargando reparaciones:", error);
  }
}

onMounted(cargarReparaciones);

function abrirFormularioNuevo() {
  reparacionSeleccionada.value = null;
  mostrarFormulario.value = true;
}

function editarReparacion(reparacion) {
  reparacionSeleccionada.value = { ...reparacion }; 
  mostrarFormulario.value = true;
}

function manejarGuardado(reparacionGuardada) {
  console.log('Reparación guardada:', reparacionGuardada);
  cerrarFormulario();
  cargarReparaciones();
}

function cerrarFormulario() {
  mostrarFormulario.value = false;
  reparacionSeleccionada.value = null; 
}


async function eliminarReparacion(id) {
  if (confirm('¿Está seguro de eliminar esta reparación?')) {
  try {
  await axios.delete(`/api/reparaciones/${id}`);
  cargarReparaciones(); 
    } catch (error) {
    console.error("Error eliminando reparación:", error);
    }
  }
}

</script>

<style>
ul {
  list-style: none;
  padding: 0;
}
li {
  border-bottom: 1px solid #eee;
  padding: 10px 0;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
li button {
    margin-left: 10px;
}

</style>
