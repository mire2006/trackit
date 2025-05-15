<template>
  <div class="reparacion-detalle-container">
    <div v-if="cargando" class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando información de la bomba...</p>
    </div>

    <div v-if="error" class="error-message-detalle">
      <p>{{ error }}</p>
      <router-link to="/" class="btn-volver-inicio">Volver al Inicio</router-link>
    </div>

    <div v-if="!cargando && !error && datosBombaYReparaciones" class="contenido-detalle">
      <div class="header-detalle">
        <h1>Detalle de Bomba y Reparaciones</h1>
      </div>

      <div class="info-bomba-card">
        <h2>Información de la Bomba</h2>
        <p><strong>Cliente:</strong> {{ datosBombaYReparaciones.bomba.Nombre_Cliente || 'N/A' }}</p>
        <p><strong>Marca:</strong> {{ datosBombaYReparaciones.bomba.Marca || 'N/A' }}</p>
        <p><strong>Modelo:</strong> {{ datosBombaYReparaciones.bomba.Modelo || 'N/A' }}</p>
        <p><strong>Circuito:</strong> {{ datosBombaYReparaciones.bomba.Circuito || 'No especificado' }}</p>
      </div>

      <div class="reparaciones-recientes-card">
        <h2>Reparaciones más Recientes</h2>
        <div v-if="reparacionesParaMostrar.length === 0" class="no-reparaciones">
          <p>Esta bomba no tiene reparaciones registradas.</p>
        </div>
        <table v-else class="tabla-reparaciones-detalle">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Servicios Realizados</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rep, index) in reparacionesParaMostrar" :key="rep.ID_Reparacion || index">
              <td>{{ formatearFecha(rep.Fecha) }}</td>
              <td>
                <ul v-if="rep.Servicios && rep.Servicios.length > 0" class="lista-servicios-detalle">
                  <li v-for="servicio in rep.Servicios" :key="servicio.ID_Tipo_Servicio">
                    {{ servicio.Nombre }}
                  </li>
                </ul>
                <span v-else>-</span>
              </td>
              <td>{{ rep.Detalles || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
     <div v-if="!cargando && !datosBombaYReparaciones && !error" class="no-datos-placeholder">
      <p>No se encontró información para la bomba especificada.</p>
      <router-link to="/" class="btn-volver-inicio">Volver al Inicio</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from '@/axios';

const route = useRoute();
const datosBombaYReparaciones = ref(null);
const cargando = ref(true);
const error = ref(null);

const bombaId = computed(() => route.params.id);

const cargarDetallesBombaYReparaciones = async () => {
  if (!bombaId.value) {
    error.value = "No se especificó un ID de bomba.";
    cargando.value = false;
    return;
  }
  cargando.value = true;
  error.value = null;
  try {
    const response = await axios.get(`/reparaciones/bomba/${bombaId.value}/informe`);
    datosBombaYReparaciones.value = response.data;
  } catch (err) {
    console.error(`Error cargando detalles para bomba ID ${bombaId.value}:`, err);
    if (err.response && err.response.status === 404) {
        error.value = `No se encontró información para la bomba con ID ${bombaId.value}.`;
    } else if (err.response && err.response.data && err.response.data.mensaje) {
        error.value = `Error al cargar detalles: ${err.response.data.mensaje}`;
    } else {
        error.value = "Ocurrió un error al cargar los detalles de la bomba.";
    }
    datosBombaYReparaciones.value = null;
  } finally {
    cargando.value = false;
  }
};

const reparacionesParaMostrar = computed(() => {
  if (datosBombaYReparaciones.value && datosBombaYReparaciones.value.reparaciones) {
    return datosBombaYReparaciones.value.reparaciones.slice(0, 3);
  }
  return [];
});

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return 'N/A';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-CL');
};

onMounted(() => {
  cargarDetallesBombaYReparaciones();
});
</script>

<style scoped>
.reparacion-detalle-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  color: #333;
}

.loading-indicator, .no-datos-placeholder {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #666;
}

.spinner {
  border: 5px solid rgba(0, 0, 0, 0.1);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border-left-color: #4e4b4c;
  animation: spin 1s ease infinite;
  margin: 0 auto 15px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message-detalle {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  padding: 15px;
  border-radius: 5px;
  text-align: center;
  margin-bottom: 20px;
}

.btn-volver-inicio {
    display: inline-block;
    margin-top: 15px;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 5px;
}
.btn-volver-inicio:hover {
    background-color: #0056b3;
}

.contenido-detalle {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.header-detalle {
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.header-detalle h1 {
  color: #4e4b4c;
  font-size: 1.8em;
  margin: 0;
}

.info-bomba-card {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 25px;
  border: 1px solid #e7e7e7;
  text-align: center;
}

.reparaciones-recientes-card {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 25px;
  border: 1px solid #e7e7e7;
}

.info-bomba-card h2, .reparaciones-recientes-card h2 {
  color: #333;
  font-size: 1.3em;
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
  text-align: center;
}

.info-bomba-card p {
  margin: 8px 0;
  font-size: 1em;
  line-height: 1.6;
}
.info-bomba-card p strong {
  color: #555;
}

.no-reparaciones p {
  font-style: italic;
  color: #777;
  text-align: center;
  padding: 10px 0;
}

.tabla-reparaciones-detalle {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.tabla-reparaciones-detalle th,
.tabla-reparaciones-detalle td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

.tabla-reparaciones-detalle th {
  background-color: #6c757d;
  color: white;
  font-weight: 500;
}

.lista-servicios-detalle {
  list-style: disc;
  padding-left: 18px;
  margin: 0;
}
.lista-servicios-detalle li {
  margin-bottom: 3px;
}
</style>
