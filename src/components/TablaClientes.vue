<template>
  <div class="tabla-clientes-container">
    <div v-if="!clientes || clientes.length === 0" class="no-datos">
      <p>No hay clientes para mostrar.</p>
    </div>
    <table v-else class="tabla-trackit">
      <thead>
        <tr>
          <th>ID</th>
          <th>RUT</th>
          <th>Nombre Cliente</th>
          <th>Dirección</th>
          <th>Contacto Principal</th>
          <th>Teléfono</th>
          <th>Email Contacto</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cliente in clientes" :key="cliente.ID_Cliente">
          <td>{{ cliente.ID_Cliente }}</td>
          <td>{{ cliente.RUT }}</td>
          <td>{{ cliente.Nombre_Cliente }}</td>
          <td>{{ cliente.Calle }} {{ cliente.Numero }}, {{ cliente.Comuna }}</td>
          <td>{{ cliente.Nombre_Contacto }} {{ cliente.Apellido_Paterno_Contacto }} {{ cliente.Apellido_Materno_Contacto || '' }}</td>
          <td>{{ cliente.Telefono_Contacto }}</td>
          <td>{{ cliente.Email_Contacto }}</td>
          <td>
            <button @click="$emit('editar', cliente)" class="btn-editar">Editar</button>
            <button @click="$emit('eliminar', cliente.ID_Cliente)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  clientes: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['editar', 'eliminar']);
</script>

<style scoped>
.tabla-clientes-container {
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
.btn-eliminar {
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

.btn-editar:hover {
  background-color: #e0a800;
}

.btn-eliminar {
  background-color: #dc3545;
  color: white;
}

.btn-eliminar:hover {
  background-color: #c82333;
}

.no-datos {
  text-align: center;
  padding: 20px;
  color: #777;
  font-style: italic;
}
</style>