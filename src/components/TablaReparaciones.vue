<template>
  <div class="tabla-reparaciones-container">
    <div v-if="!reparaciones || reparaciones.length === 0" class="no-datos">
    </div>
    <table v-else class="tabla-trackit">
      <thead>
        <tr>
          <th>ID Rep.</th>
          <th>Fecha</th>
          <th>ID Bomba</th>
          <th>Modelo Bomba</th>
          <th>Detalles (resumen)</th>
          <th>Servicios Realizados</th>
          <th>Registrado por</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="reparacion in reparaciones" :key="reparacion.ID_Reparacion">
          <td>{{ reparacion.ID_Reparacion }}</td>
          <td>{{ formatearFecha(reparacion.Fecha) }}</td>
          <td>{{ reparacion.ID_Bomba }}</td>
          <td>{{ reparacion.BombaModelo || 'N/A' }}</td>
          <td :title="reparacion.Detalles" class="detalle-reparacion">
            {{ truncarDetalles(reparacion.Detalles) }}
          </td>
          <td>
            <ul v-if="Array.isArray(reparacion.Servicios) && reparacion.Servicios.length > 0" class="lista-servicios">
              <li v-for="servicio in reparacion.Servicios.filter(s => s && s.Nombre)" :key="servicio.ID_Tipo_Servicio">
                {{ servicio.Nombre }}
              </li>
            </ul>
            <span v-else-if="Array.isArray(reparacion.Servicios) && reparacion.Servicios.length === 0">-</span>
            <span v-else>Error</span>
          </td>
          <td>{{ reparacion.UsuarioEmail || 'N/A' }}</td>
          <td class="acciones-cell">
            <button @click="$emit('editar', reparacion)" class="btn-editar" title="Editar Reparación">Editar</button>
            <button @click="$emit('generar-informe', reparacion)" class="btn-informe" title="Generar Informe">Informe</button>
            <button @click="$emit('eliminar', reparacion.ID_Reparacion)" class="btn-eliminar" title="Eliminar Reparación">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  reparaciones: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['editar', 'eliminar', 'generar-informe']);

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return 'N/A';
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

const truncarDetalles = (detalles, longitud = 50) => {
  if (!detalles) return '-';
  return detalles.length > longitud ? detalles.substring(0, longitud) + '...' : detalles;
};
</script>

<style scoped>
.tabla-reparaciones-container {
  margin-top: 20px;
  overflow-x: auto;
}

.tabla-trackit {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  font-size: 0.85em;
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

.detalle-reparacion {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.lista-servicios {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.9em;
}
.lista-servicios li {
    margin-bottom: 2px;
    padding: 2px 4px;
    background-color: #e9ecef;
    border-radius: 3px;
    display: inline-block;
    margin-right: 4px;
    white-space: nowrap;
}

.acciones-cell {
  white-space: nowrap;
  text-align: center;
}

.btn-editar,
.btn-eliminar,
.btn-informe {
  padding: 5px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  margin-right: 5px;
  transition: background-color 0.2s ease, transform 0.1s ease;
  white-space: nowrap;
}
.btn-editar:hover, .btn-eliminar:hover, .btn-informe:hover {
    transform: translateY(-1px);
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

.btn-informe {
  background-color: #17a2b8;
  color: white;
}
.btn-informe:hover { background-color: #138496; }

</style>
