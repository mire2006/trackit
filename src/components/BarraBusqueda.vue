<template>
  <div class="search-input-container">
    <input
      type="search"
      :value="modelValue"
      @input="actualizarTermino"
      :placeholder="placeholder"
      :disabled="disabled"
      class="search-input-component"
    />
    <button 
      v-if="modelValue && !disabled" 
      @click="limpiarBusqueda" 
      class="clear-search-button"
      title="Limpiar búsqueda"
    >
      &times;
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Buscar...'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const actualizarTermino = (event) => {
  emit('update:modelValue', event.target.value);
};

const limpiarBusqueda = () => {
  emit('update:modelValue', '');
};
</script>

<style scoped>
.search-input-container {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}

.search-input-component {
  width: 100%;
  padding: 10px 12px;
  padding-right: 35px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 0.95em;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input-component:focus {
  border-color: #4e4b4c;
  box-shadow: 0 0 0 0.2rem rgba(78, 75, 76, 0.25);
  outline: none;
}
.search-input-component:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
}

.clear-search-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.4em;
  color: #888;
  cursor: pointer;
  padding: 0 5px;
  line-height: 1;
}
.clear-search-button:hover {
  color: #333;
}
.clear-search-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}
</style>
