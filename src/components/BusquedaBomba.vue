<template>
  <div class="busqueda-bomba-container" ref="contenedorPrincipal">
    <div 
      class="seleccion-actual" 
      @click="toggleListaOpciones" 
      :class="{ 'disabled': disabled, 'open': mostrarListaOpciones }"
      tabindex="0" 
      @keydown.enter.space="toggleListaOpciones"
      @keydown.esc="cerrarListaSiAbierta"
    >
      <span v-if="opcionSeleccionadaTexto">{{ opcionSeleccionadaTexto }}</span>
      <span v-else class="placeholder">{{ placeholderSelect }}</span>
      <span class="arrow" :class="{ 'open': mostrarListaOpciones }">▼</span>
    </div>

    <div v-if="mostrarListaOpciones" class="lista-opciones-wrapper">
      <input
        type="search"
        v-model="terminoBusqueda"
        :placeholder="placeholderInput"
        @input="filtrarOpciones"
        @keydown.esc="cerrarListaSiAbierta"
        @keydown.down.prevent="navegarOpciones('down')"
        @keydown.up.prevent="navegarOpciones('up')"
        @keydown.enter.prevent="seleccionarOpcionConEnter"
        ref="inputBusqueda"
        class="input-busqueda-bomba"
      />
      <ul v-if="opcionesFiltradas.length > 0" class="lista-opciones" ref="listaUL">
        <li
          v-for="(opcion, index) in opcionesFiltradas"
          :key="opcion.ID_Bomba"
          @click="seleccionarOpcion(opcion)"
          :class="{ 'seleccionada': opcion.ID_Bomba === modelValue, 'highlighted': index === opcionResaltadaIndex }"
          role="option"
          :aria-selected="opcion.ID_Bomba === modelValue"
          tabindex="-1"
          :id="'opcion-bomba-' + opcion.ID_Bomba"
        >
          ID: {{ opcion.ID_Bomba }} - {{ opcion.Marca }} {{ opcion.Modelo }} (Cliente: {{ opcion.Nombre_Cliente }})
        </li>
      </ul>
      <div v-else-if="terminoBusqueda && opcionesFiltradas.length === 0" class="no-resultados">
        No se encontraron bombas para "{{ terminoBusqueda }}".
      </div>
      <div v-else-if="!terminoBusqueda && (!opciones || opciones.length === 0)" class="no-resultados">
        No hay bombas disponibles.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  opciones: {
    type: Array,
    required: true,
    default: () => []
  },
  placeholderInput: {
    type: String,
    default: 'Buscar bomba...'
  },
  placeholderSelect: {
    type: String,
    default: 'Seleccione una bomba'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const terminoBusqueda = ref('');
const mostrarListaOpciones = ref(false);
const opcionSeleccionadaTexto = ref('');
const opcionesFiltradas = ref([]);
const opcionResaltadaIndex = ref(-1);

const contenedorPrincipal = ref(null);
const inputBusqueda = ref(null);
const listaUL = ref(null);

const filtrarOpcionesInternamente = () => {
  if (!terminoBusqueda.value) {
    opcionesFiltradas.value = [...props.opciones];
  } else {
    const lowerSearchTerm = terminoBusqueda.value.toLowerCase().trim();
    opcionesFiltradas.value = props.opciones.filter(bomba =>
      (bomba.ID_Bomba?.toString().includes(lowerSearchTerm)) ||
      (bomba.Nombre_Cliente && bomba.Nombre_Cliente.toLowerCase().includes(lowerSearchTerm)) ||
      (bomba.Marca && bomba.Marca.toLowerCase().includes(lowerSearchTerm)) ||
      (bomba.Modelo && bomba.Modelo.toLowerCase().includes(lowerSearchTerm)) ||
      (bomba.Circuito && bomba.Circuito.toLowerCase().includes(lowerSearchTerm))
    );
  }
  opcionResaltadaIndex.value = -1;
};

const actualizarTextoSeleccionado = (value) => {
  if (value && props.opciones && props.opciones.length > 0) {
    const seleccionada = props.opciones.find(op => op.ID_Bomba === Number(value));
    if (seleccionada) {
      opcionSeleccionadaTexto.value = `ID: ${seleccionada.ID_Bomba} - ${seleccionada.Marca} ${seleccionada.Modelo} (Cliente: ${seleccionada.Nombre_Cliente})`;
    } else {
      opcionSeleccionadaTexto.value = '';
    }
  } else {
    opcionSeleccionadaTexto.value = '';
  }
};

watch(() => props.modelValue, (newValue) => {
  actualizarTextoSeleccionado(newValue);
}, { immediate: true });

watch(() => props.opciones, () => {
    filtrarOpcionesInternamente();
    actualizarTextoSeleccionado(props.modelValue);
}, { deep: true, immediate: true });


const filtrarOpciones = () => {
    filtrarOpcionesInternamente();
};

const scrollToHighlighted = () => {
    nextTick(() => {
        if (listaUL.value && opcionResaltadaIndex.value >= 0 && opcionResaltadaIndex.value < listaUL.value.children.length) {
            const highlightedItem = listaUL.value.children[opcionResaltadaIndex.value];
            if (highlightedItem) {
                highlightedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    });
};

const toggleListaOpciones = () => {
  if (props.disabled) return;
  mostrarListaOpciones.value = !mostrarListaOpciones.value;
  if (mostrarListaOpciones.value) {
    filtrarOpcionesInternamente(); 
    nextTick(() => {
      inputBusqueda.value?.focus();
      opcionResaltadaIndex.value = props.modelValue ? opcionesFiltradas.value.findIndex(o => o.ID_Bomba === Number(props.modelValue)) : -1;
      if (opcionResaltadaIndex.value !== -1) {
          scrollToHighlighted();
      }
    });
  } else {
      opcionResaltadaIndex.value = -1;
  }
};

const cerrarListaSiAbierta = () => {
    if (mostrarListaOpciones.value) {
        mostrarListaOpciones.value = false;
        opcionResaltadaIndex.value = -1;
    }
};

const seleccionarOpcion = (opcion) => {
  emit('update:modelValue', opcion.ID_Bomba);
  terminoBusqueda.value = '';
  mostrarListaOpciones.value = false;
  opcionResaltadaIndex.value = -1;
};

const handleClickOutside = (event) => {
  if (contenedorPrincipal.value && !contenedorPrincipal.value.contains(event.target)) {
    mostrarListaOpciones.value = false;
    opcionResaltadaIndex.value = -1;
  }
};

const navegarOpciones = (direccion) => {
    if (!mostrarListaOpciones.value || opcionesFiltradas.value.length === 0) return;

    if (direccion === 'down') {
        opcionResaltadaIndex.value = (opcionResaltadaIndex.value + 1) % opcionesFiltradas.value.length;
    } else if (direccion === 'up') {
        opcionResaltadaIndex.value = (opcionResaltadaIndex.value - 1 + opcionesFiltradas.value.length) % opcionesFiltradas.value.length;
    }
    scrollToHighlighted();
};

const seleccionarOpcionConEnter = () => {
    if (mostrarListaOpciones.value && opcionResaltadaIndex.value >= 0 && opcionResaltadaIndex.value < opcionesFiltradas.value.length) {
        seleccionarOpcion(opcionesFiltradas.value[opcionResaltadaIndex.value]);
    } else if (terminoBusqueda.value && opcionesFiltradas.value.length === 1) { 
        seleccionarOpcion(opcionesFiltradas.value[0]);
    }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

</script>

<style scoped>
.busqueda-bomba-container {
  position: relative;
  width: 100%;
  font-family: inherit;
}

.seleccion-actual {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  box-sizing: border-box;
  min-height: 40px;
}
.seleccion-actual.disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
  opacity: 0.7;
}
.seleccion-actual.open {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-color: #4e4b4c; 
}


.seleccion-actual .placeholder {
  color: #757575;
  font-size: 0.95em;
}
.seleccion-actual .arrow {
  font-size: 0.8em;
  color: #757575;
  transition: transform 0.2s ease-in-out;
}
.seleccion-actual .arrow.open {
  transform: rotate(180deg);
}


.lista-opciones-wrapper {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  border: 1px solid #ccc;
  border-top: none;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  z-index: 10;
  max-height: 250px;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.input-busqueda-bomba {
  width: calc(100% - 20px);
  padding: 10px;
  border: none;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  font-size: 0.95em;
  margin: 0 10px;
}
.input-busqueda-bomba:focus {
  outline: none;
  border-bottom-color: #4e4b4c;
}

.lista-opciones {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lista-opciones li {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 0.9em;
  border-bottom: 1px solid #f0f0f0;
}
.lista-opciones li:last-child {
    border-bottom: none;
}

.lista-opciones li:hover,
.lista-opciones li.highlighted {
  background-color: #f0f0f0;
}
.lista-opciones li.seleccionada {
  background-color: #4e4b4c;
  color: white;
  font-weight: bold;
}
.lista-opciones li.seleccionada:hover {
    background-color: #3a3738; 
}


.no-resultados {
  padding: 10px;
  text-align: center;
  color: #777;
  font-size: 0.9em;
  font-style: italic;
}
</style>
