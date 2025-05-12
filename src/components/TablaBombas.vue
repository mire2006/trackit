<template>
  <div class="tabla-bombas-container">
    <div v-if="!bombas || bombas.length === 0" class="no-datos">
      <p>No hay bombas para mostrar.</p>
    </div>
    <table v-else class="tabla-trackit">
      <thead>
        <tr>
          <th>ID Bomba</th>
          <th>Cliente</th>
          <th>Marca</th>
          <th>Modelo</th>
          <th>Circuito</th>
          <th>QR Code</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="bomba in bombas" :key="bomba.ID_Bomba">
          <td>{{ bomba.ID_Bomba }}</td>
          <td>{{ bomba.Nombre_Cliente || 'N/A' }}</td>
          <td>{{ bomba.Marca }}</td>
          <td>{{ bomba.Modelo }}</td>
          <td>{{ bomba.Circuito }}</td>
          <td>
            <button v-if="bomba.qr_code" @click="mostrarQR(bomba)" class="btn-ver-qr">Ver QR</button>
            <span v-else>No generado</span>
          </td>
          <td>
            <button @click="$emit('editar', bomba)" class="btn-editar">Editar</button>
            <button @click="$emit('eliminar', bomba.ID_Bomba)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="qrSeleccionado" class="modal-overlay" @click.self="cerrarModalQR">
      <div class="modal-content modal-qr">
        <h3>Código QR para Bomba ID: {{ bombaConQR?.ID_Bomba }}</h3>
        <p><strong>Cliente:</strong> {{ bombaConQR?.Nombre_Cliente }}</p>
        <p><strong>Modelo:</strong> {{ bombaConQR?.Marca }} - {{ bombaConQR?.Modelo }}</p>
        <p><strong>Circuito:</strong> {{ bombaConQR?.Circuito }}</p>
        <img :src="fullQrPath" alt="Código QR" class="qr-image-modal"/>
        <button @click="cerrarModalQR" class="btn-cancelar">Cerrar</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from '@/axios';

const props = defineProps({
  bombas: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['editar', 'eliminar']);

const qrSeleccionado = ref(null);
const bombaConQR = ref(null);

const backendBaseUrl = axios.defaults.baseURL;

const fullQrPath = computed(() => {
  if (qrSeleccionado.value) {
    return `${backendBaseUrl}${qrSeleccionado.value}`;
  }
  return '';
});

const mostrarQR = (bomba) => {
  qrSeleccionado.value = bomba.qr_code;
  bombaConQR.value = bomba;
};

const cerrarModalQR = () => {
  qrSeleccionado.value = null;
  bombaConQR.value = null;
};

</script>

<style scoped>
.tabla-bombas-container {
  margin-top: 20px;
  overflow-x: auto;
}

.tabla-trackit {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  font-size: 0.9em;
}

.tabla-trackit th,
.tabla-trackit td {
  border: 1px solid #ddd;
  padding: 8px 10px;
  text-align: left;
  vertical-align: middle;
}

.tabla-trackit th {
  background-color: #4e4b4c;
  color: white;
  font-weight: 600;
  white-space: nowrap;
}

.tabla-trackit tr:nth-child(even) {
  background-color: #f9f9f9;
}

.tabla-trackit tr:hover {
  background-color: #f1f1f1;
}

.btn-editar,
.btn-eliminar,
.btn-ver-qr {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  margin-right: 5px;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.btn-editar {
  background-color: #ffc107;
  color: #212529;
}
.btn-editar:hover { background-color: #e0a800; }

.btn-eliminar {
  background-color: #dc3545;
  color: white;
}
.btn-eliminar:hover { background-color: #c82333; }

.btn-ver-qr {
  background-color: #17a2b8;
  color: white;
}
.btn-ver-qr:hover {
  background-color: #138496;
}

.no-datos {
  text-align: center;
  padding: 20px;
  color: #777;
  font-style: italic;
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
  z-index: 1050;
}

.modal-qr {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  text-align: center;
  max-width: 400px;
}
.modal-qr h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
}
.modal-qr p {
    margin-bottom: 8px;
    font-size: 0.95em;
    color: #555;
    text-align: left;
}
.qr-image-modal {
  max-width: 250px;
  height: auto;
  margin: 15px auto;
  display: block;
  border: 1px solid #eee;
}
.modal-qr .btn-cancelar {
    background-color: #6c757d;
    color: white;
    margin-top: 15px;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
.modal-qr .btn-cancelar:hover {
    background-color: #5a6268;
}
</style>
