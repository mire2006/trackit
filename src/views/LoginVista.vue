<template>
  <div class="login-container">
    <h1>Iniciar Sesión</h1>
    <div v-if="error" class="error-message">{{ error }}</div>
    <form @submit.prevent="login">
      <div class="form-group">
        <label for="usuario">Usuario:</label>
        <input type="text" id="usuario" v-model="usuario" required>
      </div>
      <div class="form-group">
        <label for="contrasena">Contraseña:</label>
        <input type="password" id="contrasena" v-model="contrasena" required>
      </div>
      <button type="submit" class="login-button">Ingresar</button>
    </form>
    <router-link to="/recuperar-contrasena" class="forgot-password">¿Olvidaste tu contraseña?</router-link>
  </div>
</template>

<script>
import axios from '../axios';

export default {
  name: 'LoginVista',
  data() {
    return {
      usuario: '',
      contrasena: '',
      error: null,
    };
  },
  methods: {
    async login() {
      try {
        const response = await axios.post('/api/usuarios/login', {
          usuario: this.usuario,
          contrasena: this.contrasena,
        });

        // Simulación de guardar el token (¡Tengo que cambiarlo, que no se me olvide!)
        localStorage.setItem('token', 'fake_token');
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

        this.$router.push('/dashboard'); 

      } catch (error) {
        console.error("Error en login:", error); 
        if (error.response) {
          
          this.error = error.response.data.mensaje || 'Error en las credenciales o el usuario no existe.';
        } else if (error.request) {

          this.error = 'No se pudo conectar con el servidor. Inténtalo más tarde.';
        } else {

          this.error = 'Ocurrió un error inesperado al intentar iniciar sesión.';
        }
      }
    },
  },
};
</script>

<style scoped>
@import '../styles/Login.css';
</style>
