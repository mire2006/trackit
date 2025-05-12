<template>
  <form @submit.prevent="manejarSubmit" class="formulario-trackit">
    <div class="form-grid-bomba">
      <div class="form-group">
        <label for="clienteBomba">Cliente Asociado:</label>
        <select id="clienteBomba" v-model="formData.ID_Cliente" required :disabled="cargando">
          <option disabled value="">Seleccione un cliente</option>
          <option v-for="cliente in listaClientes" :key="cliente.ID_Cliente" :value="cliente.ID_Cliente">
            {{ cliente.Nombre_Cliente }} (RUT: {{ cliente.RUT }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="tipoBomba">Tipo de Bomba (Marca - Modelo):</label>
        <div class="tipo-bomba-selector-container">
          <select id="tipoBomba" v-model="formData.FK_ID_Tipo_Bomba" required :disabled="cargando" class="select-tipo-bomba">
            <option disabled value="">Seleccione un tipo de bomba</option>
            <option v-for="tipo in listaTiposBomba" :key="tipo.ID_Tipo_Bomba" :value="tipo.ID_Tipo_Bomba">
              {{ tipo.Marca }} - {{ tipo.Modelo }}
            </option>
          </select>
          <button
            v-if="puedeCrearTipos"
            type="button"
            @click="$emit('solicitarCrearTipoBomba')"
            class="btn-crear-rapido"
            :disabled="cargando"
            title="Crear nuevo tipo de bomba">
            +
          </button>
        </div>
      </div>

      <div class="form-group full-width">
        <label for="circuitoBomba">Circuito de la Bomba:</label>
        <input type="text" id="circuitoBomba" v-model="formData.Circuito" required placeholder="Ej: Red Alta, Sanitario ACS Torre A" :disabled="cargando">
      </div>
    </div>

    <div v-if="errorLocal" class="error-message-form">{{ errorLocal }}</div>

    <div class="modal-actions">
      <button type="submit" class="btn-guardar" :disabled="cargando">
        <span v-if="cargando" class="spinner-btn"></span>
        {{ cargando ? 'Guardando...' : (esEdicion ? 'Actualizar Bomba' : 'Crear Bomba') }}
      </button>
      <button type="button" @click="$emit('cancelar')" class="btn-cancelar" :disabled="cargando">Cancelar</button>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch, ref } from 'vue';

const props = defineProps({
  bombaData: {
    type: Object,
    default: () => ({
      ID_Bomba: null,
      ID_Cliente: '',
      FK_ID_Tipo_Bomba: '',
      Circuito: ''
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
  },
  listaClientes: {
    type: Array,
    default: () => []
  },
  listaTiposBomba: {
    type: Array,
    default: () => []
  },
  puedeCrearTipos: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['guardar', 'cancelar', 'solicitarCrearTipoBomba']);

const formData = reactive({ ID_Cliente: '', FK_ID_Tipo_Bomba: '', Circuito: '' });
const errorLocal = ref('');

watch(() => props.bombaData, (newData) => {
  formData.ID_Cliente = newData.ID_Cliente || '';
  formData.FK_ID_Tipo_Bomba = newData.FK_ID_Tipo_Bomba || '';
  formData.Circuito = newData.Circuito || '';
  formData.ID_Bomba = newData.ID_Bomba;
  errorLocal.value = '';
}, { deep: true, immediate: true });

watch(() => props.errorFormularioProp, (newError) => {
  errorLocal.value = newError;
});

const validarBombaLocal = () => {
  if (!formData.ID_Cliente || !formData.FK_ID_Tipo_Bomba || !formData.Circuito) {
    return 'Cliente, Tipo de Bomba y Circuito son campos obligatorios.';
  }
  if (String(formData.Circuito).length > 150) {
    return 'El campo Circuito no debe exceder los 150 caracteres.';
  }
  return null;
};

const manejarSubmit = () => {
  errorLocal.value = '';
  const errorValidacion = validarBombaLocal();
  if (errorValidacion) {
    errorLocal.value = errorValidacion;
    return;
  }
  const payload = {
      ...formData,
      ID_Cliente: Number(formData.ID_Cliente), 
      FK_ID_Tipo_Bomba: Number(formData.FK_ID_Tipo_Bomba),
  };
  emit('guardar', payload);
};
</script>

<style scoped>

.form-grid-bomba {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px 20px;
}

.form-group {
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
}
.form-group.full-width {
    grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 600;
  color: #444;
  font-size: 0.9em;
}

.form-group input[type="text"],
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 0.95em;
}
.form-group input:disabled,
.form-group select:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
}
.form-group input:focus,
.form-group select:focus {
    border-color: #4e4b4c;
    box-shadow: 0 0 0 0.2rem rgba(78, 75, 76, 0.25);
    outline: none;
}

.tipo-bomba-selector-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
.select-tipo-bomba {
  flex-grow: 1;
}
.btn-crear-rapido {
  padding: 8px 12px;
  font-size: 1em;
  line-height: 1;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  height: calc(2.25rem + 2px);
  height: 40px;

}
.btn-crear-rapido:hover:not(:disabled) {
  background-color: #5a6268;
}
.btn-crear-rapido:disabled {
    background-color: #ccc;
    cursor: not-allowed;
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
