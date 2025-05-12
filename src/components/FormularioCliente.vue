<template>
  <form @submit.prevent="manejarSubmit" class="formulario-trackit">
    <div class="form-grid">
      <div class="form-group">
        <label for="rut">RUT:</label>
        <input type="text" id="rut" v-model="formData.RUT" required :disabled="esEdicion || cargando">
        <small v-if="!esEdicion">(Ej: 12.345.678-9)</small>
        <small v-if="esEdicion">(No se puede modificar el RUT)</small>
      </div>
      <div class="form-group">
        <label for="nombreCliente">Nombre Cliente / Razón Social:</label>
        <input type="text" id="nombreCliente" v-model="formData.Nombre_Cliente" required :disabled="cargando">
      </div>
      <div class="form-group">
        <label for="calle">Calle:</label>
        <input type="text" id="calle" v-model="formData.Calle" required :disabled="cargando">
      </div>
      <div class="form-group">
        <label for="numero">Número:</label>
        <input type="text" id="numero" v-model="formData.Numero" required :disabled="cargando">
      </div>
      <div class="form-group">
        <label for="comuna">Comuna:</label>
        <input type="text" id="comuna" v-model="formData.Comuna" required :disabled="cargando">
      </div>
    </div>
    <hr class="form-divider">
    <h3>Datos de Contacto</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="nombreContacto">Nombre Contacto:</label>
        <input type="text" id="nombreContacto" v-model="formData.Nombre_Contacto" required :disabled="cargando">
      </div>
      <div class="form-group">
        <label for="apellidoPaternoContacto">Apellido Paterno Contacto:</label>
        <input type="text" id="apellidoPaternoContacto" v-model="formData.Apellido_Paterno_Contacto" required :disabled="cargando">
      </div>
      <div class="form-group">
        <label for="apellidoMaternoContacto">Apellido Materno Contacto:</label>
        <input type="text" id="apellidoMaternoContacto" v-model="formData.Apellido_Materno_Contacto" :disabled="cargando">
      </div>
      <div class="form-group">
        <label for="telefonoContacto">Teléfono Contacto:</label>
        <input type="tel" id="telefonoContacto" v-model="formData.Telefono_Contacto" required :disabled="cargando">
      </div>
      <div class="form-group">
        <label for="emailContacto">Email Contacto:</label>
        <input type="email" id="emailContacto" v-model="formData.Email_Contacto" required :disabled="cargando">
      </div>
    </div>

    <div v-if="errorLocal" class="error-message-form">{{ errorLocal }}</div>

    <div class="modal-actions">
      <button type="submit" class="btn-guardar" :disabled="cargando">
        <span v-if="cargando" class="spinner-btn"></span>
        {{ cargando ? 'Guardando...' : (esEdicion ? 'Actualizar Cliente' : 'Crear Cliente') }}
      </button>
      <button type="button" @click="$emit('cancelar')" class="btn-cancelar" :disabled="cargando">Cancelar</button>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch, ref } from 'vue';

const props = defineProps({
  clienteData: {
    type: Object,
    default: () => ({
      ID_Cliente: null,
      RUT: '',
      Nombre_Cliente: '',
      Calle: '',
      Numero: '',
      Comuna: '',
      Nombre_Contacto: '',
      Apellido_Paterno_Contacto: '',
      Apellido_Materno_Contacto: '',
      Telefono_Contacto: '',
      Email_Contacto: ''
    })
  },
  esEdicion: {
    type: Boolean,
    default: false
  },
  cargando: {
    type: Boolean,
    default: false
  },
  errorFormularioProp: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['guardar', 'cancelar']);

const formData = reactive({ ...props.clienteData });
const errorLocal = ref('');

watch(() => props.clienteData, (newData) => {
  Object.assign(formData, newData);
  errorLocal.value = ''; 
}, { deep: true, immediate: true });

watch(() => props.errorFormularioProp, (newError) => {
  errorLocal.value = newError;
});

const validarClienteLocal = () => {
  if (!formData.RUT || !formData.Nombre_Cliente || !formData.Calle || !formData.Numero || !formData.Comuna ||
      !formData.Nombre_Contacto || !formData.Apellido_Paterno_Contacto || !formData.Telefono_Contacto || !formData.Email_Contacto) {
    return 'Los campos RUT, Nombre Cliente, Dirección completa y datos de Contacto (excepto Ap. Materno) son obligatorios.';
  }
  if (!props.esEdicion && !/^[0-9]{1,2}(\.?[0-9]{3}){2}-?[0-9kK]{1}$/.test(formData.RUT)) {
    return 'Formato de RUT inválido. Use el formato xx.xxx.xxx-x o xxxxxxxx-x.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email_Contacto)) {
    return 'Formato de Email Contacto inválido.';
  }
  return null;
};

const manejarSubmit = () => {
  errorLocal.value = '';
  const errorValidacion = validarClienteLocal();
  if (errorValidacion) {
    errorLocal.value = errorValidacion;
    return;
  }
  emit('guardar', { ...formData });
};

</script>

<style scoped>

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 15px 20px;
}
.form-divider {
    border: 0;
    height: 1px;
    background-color: #eee;
    margin: 25px 0;
}
.formulario-trackit h3 {
    margin-top: 20px;
    margin-bottom: 15px;
    font-size: 1.1em;
    color: #4e4b4c;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
}

.form-group {
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 600;
  color: #444;
  font-size: 0.9em;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 0.95em;
}
.form-group input:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
}
.form-group input:focus {
    border-color: #4e4b4c;
    box-shadow: 0 0 0 0.2rem rgba(78, 75, 76, 0.25);
    outline: none;
}
.form-group small {
    font-size: 0.8em;
    color: #666;
    margin-top: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-guardar,
.btn-cancelar {
  padding: 10px 18px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 500;
  min-width: 100px;
}
.btn-guardar:disabled,
.btn-cancelar:disabled {
    background-color: #6c757d;
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
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-guardar {
  background-color: #007bff;
  color: white;
}
.btn-guardar:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-cancelar {
  background-color: #6c757d;
  color: white;
}
.btn-cancelar:hover:not(:disabled) {
  background-color: #5a6268;
}

.error-message-form {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  margin-bottom: -10px; 
  text-align: center;
  font-size: 0.9em;
}
</style>
