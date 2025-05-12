<template>
  <div class="login-container">
    <h1>Iniciar Sesión</h1>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="cargando" class="loading-indicator">
      <div class="spinner"></div>
      <p>Ingresando...</p>
    </div>

    <form @submit.prevent="login" v-show="!cargando">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required :disabled="cargando">
      </div>
      <div class="form-group">
        <label for="contrasena">Contraseña:</label>
        <input type="password" id="contrasena" v-model="contrasena" required :disabled="cargando">
      </div>
      <button type="submit" class="login-button" :disabled="cargando">
        Ingresar
      </button>
    </form>

    <router-link v-show="!cargando" to="/recuperar-contrasena" class="forgot-password">
      ¿Olvidaste tu contraseña?
    </router-link>
  </div>
</template>

<script>
import axios from '../axios';

export default {
  name: 'LoginVista',
  data() {
    return {
      email: '',
      contrasena: '',
      error: null,
      cargando: false,
    };
  },
  methods: {
    async login() {
      this.error = null;
      this.cargando = true;

      try {
        const response = await axios.post('/api/usuarios/login', {
          email: this.email,
          contrasena: this.contrasena,
        });

        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        console.log('Usuario guardado en localStorage:', response.data.usuario);

        this.error = '¡Inicio de sesión exitoso!';
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.$router.push('/dashboard');

      } catch (error) {
        console.error("Error en login:", error);
        if (error.response) {
          this.error = error.response.data.mensaje || 'Error en las credenciales.';
        } else if (error.request) {
          this.error = 'No se pudo conectar con el servidor. Inténtalo más tarde.';
        } else {
          this.error = 'Ocurrió un error inesperado al intentar iniciar sesión.';
        }
      } finally {
        this.cargando = false;
      }
    },
  },
};
</script>

<style scoped>
@import '../styles/Login.css';

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.login-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>

