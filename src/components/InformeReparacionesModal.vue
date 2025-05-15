<template>
  <div class="modal-overlay-informe" @click.self="cerrar">
    <div class="modal-content-informe">
      <button class="btn-cerrar-modal" @click="cerrar">×</button>
      <div class="informe-header">
        <img ref="logoImageElement" src="@/assets/trackit-logo.png" alt="Track It! Logo" class="logo-informe" />
        <h2>Informe de Reparaciones</h2>
      </div>
      <div v-if="cargando" class="loading-indicator-informe">Cargando datos del informe...</div>
      <div v-if="error" class="error-message-informe">{{ error }}</div>
      
      <div v-if="!cargando && !error && datosInforme">
        <div class="info-bomba">
          <p><strong>Cliente:</strong> {{ datosInforme.bomba.Nombre_Cliente }}</p>
          <p><strong>Bomba:</strong> {{ datosInforme.bomba.Marca }} {{ datosInforme.bomba.Modelo }}</p>
          <p><strong>Circuito:</strong> {{ datosInforme.bomba.Circuito || 'No especificado' }}</p>
        </div>
        
        <h3>Reparaciones más recientes</h3>
        <table class="tabla-informe-reparaciones">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Servicios Realizados</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="reparacionesParaMostrar.length === 0">
              <td colspan="3">No hay reparaciones recientes para mostrar.</td>
            </tr>
            <tr v-for="(rep, index) in reparacionesParaMostrar" :key="index">
              <td>{{ formatearFecha(rep.Fecha) }}</td>
              <td>
                <ul v-if="rep.Servicios && rep.Servicios.length > 0">
                  <li v-for="servicio in rep.Servicios" :key="servicio.ID_Tipo_Servicio">
                    {{ servicio.Nombre }}
                  </li>
                </ul>
                <span v-else>-</span>
              </td>
              <td>{{ rep.Detalles || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="informe-acciones">
          <button @click="descargarPDF" class="btn-descargar-pdf" :disabled="!logoCargadoParaPdf">
            {{ logoCargadoParaPdf ? 'Descargar PDF' : 'Preparando logo...' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from '@/axios';

const props = defineProps({
  bombaIdParaInforme: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['cerrar']);

const datosInforme = ref(null);
const cargando = ref(false);
const error = ref(null);
const logoImageElement = ref(null);
const logoBase64ParaPdf = ref(null);
const logoCargadoParaPdf = ref(false);

const convertirImagenABase64 = (imgElement) => {
  return new Promise((resolve, reject) => {
    if (!imgElement) {
      reject(new Error("Elemento <img> del logo no encontrado en el DOM."));
      return;
    }
    if (!imgElement.src || imgElement.src.endsWith('/undefined')) {
        console.warn("El src del logo es inválido o no está listo:", imgElement.src);
        reject(new Error("El elemento <img> del logo no tiene un 'src' válido."));
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
        const imageType = imgElement.src.endsWith('.jpg') || imgElement.src.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
        const dataURL = canvas.toDataURL(imageType);
        resolve(dataURL);
      } catch (e) {
        console.error("Error durante canvas.toDataURL:", e);
        reject(new Error("Error al convertir imagen a DataURL: " + e.message));
      }
    };
    img.onerror = (e) => {
      console.error("Error al cargar la imagen en el objeto Image():", imgElement.src, e);
      reject(new Error("Error al cargar la imagen para conversión a Base64. Verifica la ruta y que la imagen exista."));
    };
    img.src = imgElement.src;
  });
};

const cargarDatosDelInforme = async () => {
  if (!props.bombaIdParaInforme) return;
  cargando.value = true;
  error.value = null;
  try {
    const response = await axios.get(`/reparaciones/bomba/${props.bombaIdParaInforme}/informe`);
    datosInforme.value = response.data;
  } catch (err) {
    console.error("Error cargando datos del informe:", err);
    error.value = "No se pudieron cargar los datos para el informe.";
    if (err.response && err.response.data && err.response.data.mensaje) {
        error.value += ` Detalle: ${err.response.data.mensaje}`;
    }
  } finally {
    cargando.value = false;
  }
};

const reparacionesParaMostrar = computed(() => {
  if (datosInforme.value && datosInforme.value.reparaciones) {
    return datosInforme.value.reparaciones.slice(0, 3);
  }
  return [];
});

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return 'N/A';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-CL');
};

const descargarPDF = async () => {
  if (!datosInforme.value) {
    alert("Los datos del informe aún no están listos.");
    return;
  }
  if (!logoCargadoParaPdf.value && !logoBase64ParaPdf.value) {
      alert("El logo aún no está listo para el PDF. Intentando de nuevo o puede continuar sin logo.");
      if (logoImageElement.value && !logoBase64ParaPdf.value) {
          try {
              logoBase64ParaPdf.value = await convertirImagenABase64(logoImageElement.value);
              if (logoBase64ParaPdf.value) logoCargadoParaPdf.value = true;
          } catch (logoError) {
              console.warn("No se pudo cargar el logo para el PDF en el reintento:", logoError);
          }
      }
      if (!logoBase64ParaPdf.value) { 
          console.warn("Generando PDF sin logo debido a error previo.");
      }
  }

  const doc = new jsPDF();
  const margin = 15;
  let currentY = margin;
  const lineHeight = 7;
  const sectionSpacing = 10;

  if (logoBase64ParaPdf.value) {
    const logoSizeEnPDF = 30;
    try {
      const imageType = (logoImageElement.value && (logoImageElement.value.src.endsWith('.jpg') || logoImageElement.value.src.endsWith('.jpeg'))) ? 'JPEG' : 'PNG';
      doc.addImage(logoBase64ParaPdf.value, imageType.toUpperCase(), margin, currentY, logoSizeEnPDF, logoSizeEnPDF);
    } catch (e) {
      console.error("Error añadiendo logo al PDF:", e);
    }
    currentY += logoSizeEnPDF + 5;
  }  

  doc.setFontSize(18);
  doc.text("Informe de Reparaciones", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += sectionSpacing;

  doc.setFontSize(12);
  doc.text(`Cliente: ${datosInforme.value.bomba.Nombre_Cliente}`, margin, currentY);
  currentY += lineHeight;
  doc.text(`Bomba: ${datosInforme.value.bomba.Marca} ${datosInforme.value.bomba.Modelo}`, margin, currentY);
  currentY += lineHeight;
  doc.text(`Circuito: ${datosInforme.value.bomba.Circuito || 'No especificado'}`, margin, currentY);
  currentY += sectionSpacing;

  doc.setFontSize(14);
  doc.text("Reparaciones más recientes", margin, currentY);
  currentY += lineHeight;

  const tableColumn = ["Fecha", "Servicios Realizados", "Detalles"];
  const tableRows = [];

  reparacionesParaMostrar.value.forEach(rep => {
    const servicios = rep.Servicios && rep.Servicios.length > 0 
                      ? rep.Servicios.map(s => s.Nombre).join(',\n')
                      : '-';
    const repData = [
      formatearFecha(rep.Fecha),
      servicios,
      rep.Detalles || '-', 
    ];
    tableRows.push(repData);
  });

  autoTable(doc, {
    startY: currentY,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped', 
    headStyles: { fillColor: [78, 75, 76] }, 
    styles: { cellPadding: 2, fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 50 }, 
      2: { cellWidth: 'auto' } 
    },
    didDrawPage: function (data) {
        doc.setFontSize(10);
        doc.text("Track It! - Informe de bomba", data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });
  
  const nombreClienteSanitizado = datosInforme.value.bomba.Nombre_Cliente
                                  ? datosInforme.value.bomba.Nombre_Cliente.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_').toLowerCase()
                                  : 'desconocido';
  doc.save(`informe_bomba_${props.bombaIdParaInforme}_cliente_${nombreClienteSanitizado}.pdf`);
};
  
const cerrar = () => {
  emit('cerrar');
};

onMounted(async () => {
  await cargarDatosDelInforme();
  if (logoImageElement.value) {
    const CargarYConvertirLogo = async () => {
        try {
            logoBase64ParaPdf.value = await convertirImagenABase64(logoImageElement.value);
            logoCargadoParaPdf.value = true;
        } catch (error) {
            console.error("Error al convertir el logo a Base64:", error);
            logoCargadoParaPdf.value = true; 
        }
    };

    if (logoImageElement.value.complete && logoImageElement.value.naturalWidth > 0) {
        CargarYConvertirLogo();
    } else {
        logoImageElement.value.onload = CargarYConvertirLogo;
        logoImageElement.value.onerror = () => {
            console.error("El elemento <img> del logo falló al cargar su 'src'.");
            logoCargadoParaPdf.value = true; 
        };
    }
  } else {
      console.warn("Elemento <img> del logo no disponible en onMounted.");
      logoCargadoParaPdf.value = true;
  }
});
</script>

<style scoped>
.modal-overlay-informe {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}
.modal-content-informe {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
.btn-cerrar-modal {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}
.informe-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}
.logo-informe {
  width: 100px;
  height: auto;
  margin-right: 20px;
}
.informe-header h2 {
  margin: 0;
  font-size: 1.8em;
  color: #333;
}
.info-bomba {
  margin-bottom: 15px;
  font-size: 0.95em;
}
.info-bomba p {
  margin: 5px 0;
}
.tabla-informe-reparaciones {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 0.9em;
}
.tabla-informe-reparaciones th,
.tabla-informe-reparaciones td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.tabla-informe-reparaciones th {
  background-color: #f2f2f2;
}
.tabla-informe-reparaciones ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tabla-informe-reparaciones ul li {
  margin-bottom: 2px;
}

.informe-acciones {
  margin-top: 25px;
  text-align: right;
}
.btn-descargar-pdf {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.btn-descargar-pdf:hover {
  background-color: #0056b3;
}

.btn-descargar-pdf:hover:not(:disabled) {
  background-color: #0056b3;
}
.btn-descargar-pdf:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.loading-indicator-informe, .error-message-informe {
    text-align: center;
    padding: 20px;
    font-size: 1.1em;
    color: #555;
}
.error-message-informe {
    color: #dc3545;
}

</style>
