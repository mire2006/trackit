<template>
  <div>
    <h1>Gestión de Reparaciones</h1>

    <button @click="mostrarFormulario = !mostrarFormulario">
      {{ mostrarFormulario ? 'Ocultar Formulario' : 'Nueva Reparación' }}
    </button>
    <FormularioReparacion 
      v-if="mostrarFormulario" 
      :reparacionParaEditar="reparacionSeleccionada" 
      @reparacionGuardada="manejarGuardado"
      @cancelado="cerrarFormulario"
    />

    <h2>Lista de Reparaciones</h2>
    <ul>
        <button @click="editarReparacion(reparacion)">Editar</button>
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

function editarReparacion(reparacion) {
  reparacionSeleccionada.value = reparacion;
  mostrarFormulario.value = true;
}

function manejarGuardado(reparacionGuardada) {
  console.log('Reparación guardada:', reparacionGuardada);
  mostrarFormulario.value = false;
  reparacionSeleccionada.value = null;
  cargarReparaciones();
}

function cerrarFormulario() {
  mostrarFormulario.value = false;
  reparacionSeleccionada.value = null;
}
</script>

<style>

</style>
