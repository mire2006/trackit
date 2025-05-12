<template>
  <form @submit.prevent="manejarSubmit" class="formulario-trackit">
    <div class="form-grid-tipo-bomba">
      <div class="form-group">
        <label for="marcaTipoBomba">Marca:</label>
        <input type="text" id="marcaTipoBomba" v-model="formData.Marca" required :disabled="cargando">
      </div>
      <div class="form-group">
        <label for="modeloTipoBomba">Modelo:</label>
        <input type="text" id="modeloTipoBomba" v-model="formData.Modelo" required :disabled="cargando">
      </div>
      <div class="form-group full-width-tipo-bomba">
        <label for="descripcionTecnicaTipoBomba">Descripción Técnica (Opcional):</label>
        <textarea id="descripcionTecnicaTipoBomba" v-model="formData.Descripcion_Tecnica" rows="3" :disabled="cargando"></textarea>
      </div>
    </div>

    <div v-if="errorLocal" class="error-message-form">{{ errorLocal }}</div>

    <div class="modal-actions">
      <button type="submit" class="btn-guardar" :disabled="cargando">
        <span v-if="cargando" class="spinner-btn"></span>
        {{ cargando ? 'Guardando...' : (esEdicion ? 'Actualizar Tipo' : 'Crear Tipo') }}
      </button>
      <button type="button" @click="$emit('cancelar')" class="btn-cancelar" :disabled="cargando">Cancelar</button>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch, ref } from 'vue';

const props = defineProps({
  tipoBombaData: {
    type: Object,
    default: () => ({
      ID_Tipo_Bomba: null,
      Marca: '',
      Modelo: '',
      Descripcion_Tecnica: ''
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

const formData = reactive({ ...props.tipoBombaData });
const errorLocal = ref('');

watch(() => props.tipoBombaData, (newData) => {
  Object.assign(formData, newData);
  errorLocal.value = '';
}, { deep: true, immediate: true });

watch(() => props.errorFormularioProp, (newError) => {
  errorLocal.value = newError;
});

const validarTipoBombaLocal = () => {
  if (!formData.Marca || !formData.Modelo) {
    return 'Marca y Modelo son campos obligatorios.';
  }
  return null;
};

const manejarSubmit = () => {
  errorLocal.value = '';
  const errorValidacion = validarTipoBombaLocal();
  if (errorValidacion) {
    errorLocal.value = errorValidacion;
    return;
  }
  emit('guardar', { ...formData });
};
</script>

<style scoped>

.form-grid-tipo-bomba {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px 20px;
}

.form-group {
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
}
.form-group.full-width-tipo-bomba {
    grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 600;
  color: #444;
  font-size: 0.9em;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 0.95em;
}
.form-group textarea {
    resize: vertical;
}
.form-group input:disabled,
.form-group textarea:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
}
.form-group input:focus,
.form-group textarea:focus {
    border-color: #4e4b4c;
    box-shadow: 0 0 0 0.2rem rgba(78, 75, 76, 0.25);
    outline: none;
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
