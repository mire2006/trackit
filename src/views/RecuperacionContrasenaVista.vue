<template>
    <div class="recuperacion-container">
      <h1>Recuperación de Contraseña</h1>
      <p>Ingresa tu nombre de usuario o correo electrónico para recuperar tu contraseña.</p>
      <form @submit.prevent="recuperarContrasena">
        <div class="form-group">
          <label for="identificador">Usuario o Correo Electrónico:</label>
          <input type="text" id="identificador" v-model="identificador" required>
        </div>
        <button type="submit" class="recuperar-button">Recuperar Contraseña</button>
      </form>
      <div v-if="mensaje" class="mensaje">{{ mensaje }}</div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'RecuperacionContrasenaVista',
    data() {
      return {
        identificador: '',
        mensaje: null,
      };
    },
    methods: {
      async recuperarContrasena() {
        try {
          const response = await axios.post('/api/usuarios/recuperar-contrasena', {
            identificador: this.identificador,
          });
          this.mensaje = response.data.mensaje; 
        } catch (error) {
          if (error.response) {
            this.mensaje = error.response.data.mensaje || 'Error al solicitar la recuperación de contraseña.';
          } else {
            this.mensaje = 'Error inesperado.';
          }
        }
      },
    },
  };
  </script>
  
  <style scoped>

  @import '../styles/RecuperacionContrasena.css';
  </style>
