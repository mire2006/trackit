<template>
  <div class="dashboard-profile-container">
    <h1>Perfil de Usuario</h1>
    <div v-if="usuario" class="dashboard-profile-content"> 
      
      <div class="user-details-column">
        <h2>Tus Datos</h2>
        <div class="details-list">
          <p><strong>Nombre:</strong> {{ usuario.Nombre }} {{ usuario.Apellido_Paterno }} {{ usuario.Apellido_Materno || '' }}</p>
          <p><strong>Rol:</strong> {{ usuario.Rol }}</p>
          <p><strong>Email:</strong> {{ usuario.Email }}</p>
          <p class="info-email">Si necesitas cambiar tu correo, por favor haz la solicitud a un admin</p>
        </div>
      </div>

      <div class="password-form-column">
        <form @submit.prevent="cambiarContrasena" class="password-change-form">
          <h2>Cambiar Contraseña</h2>
          <div class="form-group">
            <label for="nuevaContrasena">Nueva Contraseña:</label>
            <input type="password" id="nuevaContrasena" v-model="nuevaContrasena" required minlength="6">
          </div>
          <div class="form-group">
            <label for="confirmarContrasena">Confirmar Nueva Contraseña:</label>
            <input type="password" id="confirmarContrasena" v-model="confirmarContrasena" required minlength="6">
          </div>
          <button type="submit" class="actualizar-button" :disabled="!nuevaContrasena || !confirmarContrasena">Actualizar Contraseña</button>
          <p v-if="mensaje" :class="{'mensaje-exito': esExito, 'mensaje-error': !esExito}" class="mensaje">{{ mensaje }}</p>
        </form>
      </div>

    </div>
    <div v-else class="loading-message">
      <p>Cargando información del perfil...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/axios';

const usuario = ref(null);
const nuevaContrasena = ref('');
const confirmarContrasena = ref('');
const mensaje = ref('');
const esExito = ref(false);

const cargarUsuarioDesdeLocalStorage = () => {
  const usuarioDataString = localStorage.getItem('usuario');
  if (usuarioDataString) {
    try {
      const datosUsuario = JSON.parse(usuarioDataString);
      usuario.value = {
        Nombre: datosUsuario.Nombre,
        Apellido_Paterno: datosUsuario.Apellido_Paterno,
        Apellido_Materno: datosUsuario.Apellido_Materno || '',
        Rol: datosUsuario.Rol,
        Email: datosUsuario.Email,
        ID_Usuario: datosUsuario.ID_Usuario
      };
    } catch (e) {
      console.error("Error al analizar datos de usuario desde localStorage en Perfil:", e);
      localStorage.removeItem('usuario');
    }
  }
};

const obtenerDatosPerfil = async () => {
  try {
    const { data } = await axios.get('usuarios/me');
    usuario.value = data;
  } catch (error) {
    console.error('Error al obtener datos del perfil:', error);
    mensaje.value = error.response?.data?.mensaje || 'No se pudo cargar la información del perfil.';
    esExito.value = false;

    if (!usuario.value) {
        console.error("No se pudo obtener el perfil ni desde localStorage ni desde la API.");
    }
  }
};

onMounted(() => {
  cargarUsuarioDesdeLocalStorage();
  obtenerDatosPerfil();
});

const cambiarContrasena = async () => {
  mensaje.value = '';
  esExito.value = false;

  if (nuevaContrasena.value !== confirmarContrasena.value) {
    mensaje.value = 'Las contraseñas no coinciden.';
    return;
  }
  if (nuevaContrasena.value.length < 6) {
    mensaje.value = 'La nueva contraseña debe tener al menos 6 caracteres.';
    return;
  }

  try {
    await axios.put('/api/usuarios/me/password', {
      Contrasena: nuevaContrasena.value
    });

    mensaje.value = 'Contraseña actualizada exitosamente.';
    esExito.value = true;
    nuevaContrasena.value = '';
    confirmarContrasena.value = '';

  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    mensaje.value = error.response?.data?.mensaje || 'Error al actualizar la contraseña.';
    esExito.value = false;
  }
};
</script>

<style scoped>

.dashboard-profile-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem 3rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dashboard-profile-container h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2.5rem;
}

.dashboard-profile-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 3rem;
  flex-wrap: wrap;
}

.user-details-column,
.password-form-column {
  flex: 1;
  min-width: 300px;
  background-color: white;
  padding: 1.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.user-details-column h2,
.password-form-column h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #4e4b4c;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eaeaea;
  text-align: left;
}

.details-list p {
  margin-bottom: 0.8rem;
  font-size: 1.05em;
  line-height: 1.5;
  color: #333;
  text-align: left;
}

.details-list strong {
  display: inline-block;
  min-width: 80px;
  color: #555;
  margin-right: 8px;
  font-weight: 600;
}

.info-email {
  font-size: 0.85em;
  color: #777;
  margin-top: 0.2rem;
  font-style: italic;
  text-align: left;
}


.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #444;
}

.form-group input[type="password"] {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1em;
}

.form-group input[type="password"]:focus {
    border-color: #4e4b4c;
    box-shadow: 0 0 0 0.2rem rgba(78, 75, 76, 0.25);
    outline: none;
}

.actualizar-button {
  display: block;
  width: 100%;
  background-color: #4e4b4c;
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out;
  margin-top: 1.5rem;
}

.actualizar-button:hover:not(:disabled) {
  background-color: #3a3738;
}

.actualizar-button:disabled {
  background-color: #d3d3d3;
  cursor: not-allowed;
}

.mensaje {
  margin-top: 1.5rem;
  padding: 0.75rem;
  border-radius: 4px;
  text-align: center;
  font-size: 0.95em;
}

.mensaje-exito {
  background-color: #d1e7dd;
  color: #0f5132;
  border: 1px solid #badbcc;
}

.mensaje-error {
  background-color: #f8d7da;
  color: #842029;
  border: 1px solid #f5c2c7;
}

.loading-message {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1em;
}

@media (max-width: 767px) {
  .dashboard-profile-content {
    flex-direction: column;
    gap: 2rem;
  }
  .user-details-column,
  .password-form-column {
    min-width: 100%;
  }
  .dashboard-profile-container {
    padding: 1.5rem;
  }
  .dashboard-profile-container h1 {
    font-size: 1.8rem;
    margin-bottom: 2rem;
  }
  .user-details-column h2,
  .password-form-column h2 {
    font-size: 1.3rem;
  }
}
</style>
