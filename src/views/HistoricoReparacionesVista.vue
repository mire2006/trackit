<template>
  <div class="historico-reparaciones-container">
    <img ref="logoImageElementRef" src="@/assets/trackit-logo.png" alt="Track It! Logo" style="display: none;" />

    <h1>Informe Histórico de Reparaciones por Bomba</h1>
    <p class="subtitulo">Seleccione una bomba para ver su historial completo de reparaciones.</p>

    <div class="selector-bomba-container">
      <label for="bomba-historico-selector">Seleccionar Bomba:</label>
      <BusquedaBomba
        id="bomba-historico-selector"
        v-model="bombaSeleccionadaId"
        :opciones="listaCompletaBombas"
        placeholderSelect="Busque y seleccione una bomba"
        placeholderInput="Buscar bomba por ID, Marca, Modelo, Cliente..."
        :disabled="cargandoBombas"
        @update:modelValue="cargarHistorialBomba"
      />
    </div>

    <div v-if="cargandoHistorial" class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando historial de la bomba...</p>
    </div>

    <div v-if="errorAlCargarHistorial" class="error-message-api">
      {{ errorAlCargarHistorial }}
    </div>

    <div v-if="bombaSeleccionadaInfo && !cargandoHistorial && !errorAlCargarHistorial" class="info-bomba-seleccionada">
      <h2>Historial para Bomba ID: {{ bombaSeleccionadaId }}</h2>
      <div class="detalles-bomba-card">
        <p><strong>Cliente:</strong> {{ bombaSeleccionadaInfo.bomba.Nombre_Cliente || 'N/A' }}</p>
        <p><strong>Marca:</strong> {{ bombaSeleccionadaInfo.bomba.Marca || 'N/A' }}</p>
        <p><strong>Modelo:</strong> {{ bombaSeleccionadaInfo.bomba.Modelo || 'N/A' }}</p>
        <p><strong>Circuito:</strong> {{ bombaSeleccionadaInfo.bomba.Circuito || 'N/A' }}</p>
      </div>

      <div class="acciones-informe" v-if="historialReparaciones.length > 0">
         <button @click="descargarHistorialPDF" class="btn-descargar-pdf-historico" :disabled="!logoCargadoParaPdfHistorico">
            {{ logoCargadoParaPdfHistorico ? 'Descargar Histórico PDF' : 'Preparando PDF...' }}
          </button>
      </div>
      
      <TablaHistoricoReparaciones :reparaciones="historialReparaciones" />
      
      <div v-if="historialReparaciones.length === 0 && bombaSeleccionadaId && !cargandoHistorial" class="no-datos">
        <p>Esta bomba no tiene reparaciones registradas.</p>
      </div>
    </div>
    <div v-else-if="!bombaSeleccionadaId && !cargandoBombas && !cargandoHistorial" class="no-datos">
        <p>Por favor, seleccione una bomba para ver su historial.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/axios';
import BusquedaBomba from '@/components/BusquedaBomba.vue';
import TablaHistoricoReparaciones from '@/components/TablaHistoricoReparaciones.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const listaCompletaBombas = ref([]);
const bombaSeleccionadaId = ref(null);
const bombaSeleccionadaInfo = ref(null);
const historialReparaciones = ref([]);

const cargandoBombas = ref(false);
const cargandoHistorial = ref(false);
const errorAlCargarHistorial = ref(null);

const logoImageElementRef = ref(null);
const logoBase64ParaPdfHistorico = ref(null);
const logoCargadoParaPdfHistorico = ref(false);

const convertirImagenABase64ParaHistorico = (imgElement) => {
  return new Promise((resolve, reject) => {
    if (!imgElement) {
      reject(new Error("Elemento <img> del logo no encontrado."));
      return;
    }
    if (!imgElement.src || imgElement.src.endsWith('/undefined') || !imgElement.src.startsWith('data:image') && !imgElement.src.startsWith('http') && !imgElement.src.startsWith('/')) {
        console.warn("El src del logo es inválido o no está listo para procesar:", imgElement.src);
        reject(new Error("El elemento <img> del logo no tiene un 'src' válido o accesible."));
        return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const imageType = imgElement.src.toLowerCase().endsWith('.jpg') || imgElement.src.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
        const dataURL = canvas.toDataURL(imageType);
        resolve(dataURL);
      } catch (e) {
        console.error("Error durante canvas.toDataURL:", e);
        reject(new Error("Error al convertir imagen a DataURL: " + e.message));
      }
    };
    img.onerror = (e) => {
      console.error("Error al cargar la imagen en el objeto Image() para conversión:", imgElement.src, e);
      reject(new Error("Error al cargar la imagen para conversión a Base64."));
    };
    img.src = imgElement.src;
  });
};

const cargarListaBombas = async () => {
  cargandoBombas.value = true;
  try {
    const response = await axios.get('/bombas');
    listaCompletaBombas.value = response.data;
  } catch (error) {
    console.error("Error cargando lista de bombas:", error);
    errorAlCargarHistorial.value = "Error al cargar la lista de bombas disponibles.";
  } finally {
    cargandoBombas.value = false;
  }
};

const cargarHistorialBomba = async (idBomba) => {
  if (!idBomba) {
    bombaSeleccionadaInfo.value = null;
    historialReparaciones.value = [];
    return;
  }
  cargandoHistorial.value = true;
  errorAlCargarHistorial.value = null;
  try {
    const response = await axios.get(`/reparaciones/bomba/${idBomba}/informe`);
    bombaSeleccionadaInfo.value = response.data;
    historialReparaciones.value = response.data.reparaciones || [];
  } catch (error) {
    console.error(`Error cargando historial para bomba ID ${idBomba}:`, error);
    bombaSeleccionadaInfo.value = null;
    historialReparaciones.value = [];
    errorAlCargarHistorial.value = `Error al cargar el historial de la bomba ID ${idBomba}.`;
    if (error.response && error.response.data && error.response.data.mensaje) {
        errorAlCargarHistorial.value += ` Detalle: ${error.response.data.mensaje}`;
    }
  } finally {
    cargandoHistorial.value = false;
  }
};

const formatearFechaParaPDF = (fechaISO) => {
  if (!fechaISO) return 'N/A';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-CL');
};

const descargarHistorialPDF = async () => {
  if (!bombaSeleccionadaInfo.value || !historialReparaciones.value) {
    alert("No hay datos de historial para generar el PDF.");
    return;
  }
  if (!logoCargadoParaPdfHistorico.value && !logoBase64ParaPdfHistorico.value) {
      if (logoImageElementRef.value) {
          try {
              logoBase64ParaPdfHistorico.value = await convertirImagenABase64ParaHistorico(logoImageElementRef.value);
              if (logoBase64ParaPdfHistorico.value) logoCargadoParaPdfHistorico.value = true;
          } catch (e) { console.warn("No se pudo cargar el logo para PDF (reintento):", e); }
      }
      if(!logoBase64ParaPdfHistorico.value) console.warn("Generando PDF de historial sin logo.");
  }

  const doc = new jsPDF();
  const margin = 15;
  let currentY = margin;
  const lineHeight = 7;
  const sectionSpacing = 10;
  const { bomba, reparaciones } = bombaSeleccionadaInfo.value;

  if (logoBase64ParaPdfHistorico.value) {
    const logoSizeEnPDF = 30; 
    try {
      const imageTypeString = (logoImageElementRef.value?.src?.toLowerCase().endsWith('.jpg') 
      || logoImageElementRef.value?.src?.toLowerCase().endsWith('.jpeg')) ? 'JPEG' : 'PNG';
      doc.addImage(logoBase64ParaPdfHistorico.value, imageTypeString, margin, currentY, logoSizeEnPDF, logoSizeEnPDF);
    } catch (e) { console.error("Error añadiendo logo al PDF de historial:", e); }
    currentY += logoSizeEnPDF + 5;
  }

  doc.setFontSize(18);
  doc.text("Historial Completo de Reparaciones", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += sectionSpacing;

  doc.setFontSize(12);
  doc.text(`Cliente: ${bomba.Nombre_Cliente || 'N/A'}`, margin, currentY);
  currentY += lineHeight;
  doc.text(`Bomba: ${bomba.Marca || 'N/A'} ${bomba.Modelo || 'N/A'}`, margin, currentY);
  currentY += lineHeight;
  doc.text(`Circuito: ${bomba.Circuito || 'No especificado'}`, margin, currentY);
  currentY += sectionSpacing;

  const tableColumn = ["Fecha", "Servicios Realizados", "Detalles", "Registrado por"];
  const tableRows = [];

  reparaciones.forEach(rep => {
    const servicios = rep.Servicios && rep.Servicios.length > 0 
                      ? rep.Servicios.map(s => s.Nombre).join(',\n') 
                      : '-';
    tableRows.push([
      formatearFechaParaPDF(rep.Fecha),
      servicios,
      rep.Detalles || '-',
      rep.UsuarioEmail || 'N/A'
    ]);
  });

  autoTable(doc, {
    startY: currentY,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [78, 75, 76] },
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 35 }
    },
    didDrawPage: (data) => {
      doc.setFontSize(10);
      doc.text(`Página ${data.pageNumber} - Historial Bomba ID ${bombaSeleccionadaId.value}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });

  const nombreClienteSanitizado = bomba.Nombre_Cliente
                                  ? bomba.Nombre_Cliente.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_').toLowerCase()
                                  : 'desconocido';
  doc.save(`historial_completo_bomba_${bombaSeleccionadaId.value}_cliente_${nombreClienteSanitizado}.pdf`);
};

onMounted(async () => {
  await cargarListaBombas();
  
  if (logoImageElementRef.value) {
    const CargarYConvertirLogoHistorico = async () => {
        try {
            if (logoImageElementRef.value.complete && logoImageElementRef.value.naturalWidth > 0) {
                 logoBase64ParaPdfHistorico.value = await convertirImagenABase64ParaHistorico(logoImageElementRef.value);
            } else {
                await new Promise((resolve, reject) => {
                    logoImageElementRef.value.onload = async () => {
                        try {
                            logoBase64ParaPdfHistorico.value = await convertirImagenABase64ParaHistorico(logoImageElementRef.value);
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    };
                    logoImageElementRef.value.onerror = () => {
                        reject(new Error("El <img> del logo para historial falló al cargar su 'src'."));
                    };
                    if (!logoImageElementRef.value.src || logoImageElementRef.value.src.endsWith('/undefined')) {
                        console.warn("Src del logo inválido al intentar adjuntar onload/onerror.");
                        reject(new Error("Src del logo inválido."));
                    }
                });
            }
            logoCargadoParaPdfHistorico.value = true;
        } catch (error) {
            console.error("Error final al convertir el logo para PDF histórico:", error);
            logoCargadoParaPdfHistorico.value = true; 
        }
    };
    CargarYConvertirLogoHistorico();
  } else {
      console.warn("Elemento <img> del logo no disponible en onMounted para PDF histórico.");
      logoCargadoParaPdfHistorico.value = true;
  }
});
</script>

<style scoped>
.historico-reparaciones-container {
  padding: 25px;
  max-width: 1000px;
  margin: 2rem auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.historico-reparaciones-container h1 {
  color: #333;
  text-align: center;
  margin-bottom: 10px;
}
.subtitulo {
  text-align: center;
  color: #666;
  margin-bottom: 25px;
  font-size: 0.95em;
}

.selector-bomba-container {
  margin-bottom: 25px;
  max-width: 500px;
}
.selector-bomba-container label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #4e4b4c;
}

.info-bomba-seleccionada {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #eee;
}

.info-bomba-seleccionada h2 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}
.detalles-bomba-card {
    margin-bottom: 20px;
}
.detalles-bomba-card p {
  margin: 5px 0;
  font-size: 0.95em;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: #555;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #4e4b4c;
  animation: spin 1s ease infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message-api {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}
.no-datos {
  text-align: center;
  padding: 20px;
  color: #777;
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 5px;
  margin-top: 15px;
}
.acciones-informe {
    margin-bottom: 15px;
    text-align: right;
}
.btn-descargar-pdf-historico {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
}
.btn-descargar-pdf-historico:hover:not(:disabled) {
  background-color: #0056b3;
}
.btn-descargar-pdf-historico:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>
