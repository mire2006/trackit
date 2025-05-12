 <template>
  <div class="tabla-historico-container">
    <div v-if="!reparaciones || reparaciones.length === 0" class="no-datos-tabla">
      <p>No hay historial de reparaciones para esta bomba.</p>
    </div>
    <table v-else class="tabla-trackit tabla-historico">
      <thead>
        <tr>
          <th>ID Rep.</th>
          <th>Fecha</th>
          <th>Servicios Realizados</th>
          <th>Detalles</th>
          <th>Registrado por</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="reparacion in reparaciones" :key="reparacion.ID_Reparacion">
          <td>{{ reparacion.ID_Reparacion }}</td>
          <td>{{ formatearFecha(reparacion.Fecha) }}</td>
          <td>
            <ul v-if="Array.isArray(reparacion.Servicios) && reparacion.Servicios.length > 0" class="lista-servicios-historico">
              <li v-for="servicio in reparacion.Servicios.filter(s => s && s.Nombre)" :key="servicio.ID_Tipo_Servicio">
                {{ servicio.Nombre }}
              </li>
            </ul>
            <span v-else>-</span>
          </td>
          <td :title="reparacion.Detalles" class="detalle-reparacion-historico">
            {{ reparacion.Detalles || '-' }}
          </td>
          <td>{{ reparacion.UsuarioEmail || 'N/A' }}</td>
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

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return 'N/A';
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
};
</script>

<style scoped>
.tabla-historico-container {
  margin-top: 20px;
  overflow-x: auto;
}

.tabla-trackit.tabla-historico {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.tabla-trackit th,
.tabla-trackit td {
  border: 1px solid #e0e0e0;
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}

.tabla-trackit th {
  background-color: #5a6268;
  color: white;
  font-weight: 500;
}

.tabla-trackit tr:nth-child(even) {
  background-color: #f8f9fa;
}

.detalle-reparacion-historico {
    max-width: 300px;
    white-space: pre-wrap;
    word-break: break-word;
}

.lista-servicios-historico {
    list-style: disc;
    padding-left: 18px;
    margin: 0;
}
.lista-servicios-historico li {
    margin-bottom: 3px;
}

.no-datos-tabla {
  text-align: center;
  padding: 15px;
  color: #6c757d;
  font-style: italic;
}
</style>