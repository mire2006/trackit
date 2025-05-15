<template>
    <div class="perfil-container">
      <h1>Perfil de Usuario</h1>
      <div class="user-info">
        <div class="avatar">
          <img src="../assets/avatar.png" alt="Avatar" />
        </div>
        <div class="user-details">
          <p class="nombre">{{ usuario.Nombre }}</p>
          <p class="rol">{{ usuario.Rol }}</p>
        </div>
      </div>
      <div class="form-container">
        <form @submit.prevent="actualizarPerfil">
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" v-model="usuario.Email" readonly>  </div>
          <div class="form-group">
            <label for="contrasena">Contraseña (dejar vacío si no se va a cambiar):</label>
            <input type="password" id="contrasena" v-model="nuevaContrasena">
          </div>
          <div class="form-group">
            <label for="repetirContrasena">Repite nueva contraseña:</label>
            <input type="password" id="repetirContrasena" v-model="repetirNuevaContrasena">
          </div>
          <button type="submit" class="actualizar-button">Aceptar</button>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'PerfilVista',
    data() {
      return {
        usuario: {  
          Nombre: '',
          Rol: '',
          Email: '',
        },
        nuevaContrasena: '',
        repetirNuevaContrasena: '',
        mensaje: null,
      };
    },
    async mounted() {
      try {
        const usuarioLogueado = JSON.parse(localStorage.getItem('usuario')); 
        if (usuarioLogueado) {
          this.usuario = usuarioLogueado;
        }
      } catch (error) {
        console.error('Error al obtener la información del usuario:', error);
      }
    },
    methods: {
      async actualizarPerfil() {
        if (this.nuevaContrasena && this.nuevaContrasena !== this.repetirNuevaContrasena) {
          this.mensaje = 'Las contraseñas no coinciden.';
          return;
        }
  
        try {
          const response = await axios.put(`/usuarios/${this.usuario.ID_Usuario}`, {
            Contrasena: this.nuevaContrasena,
          });
  
          this.mensaje = 'Perfil actualizado correctamente.';
          localStorage.setItem('usuario', JSON.stringify(response.data));
        } catch (error) {
          if (error.response) {
            this.mensaje = error.response.data.mensaje || 'Error al actualizar el perfil.';
          } else {
            this.mensaje = 'Error inesperado.';
          }
        }
      },
    },
  };
  </script>
  
  <style scoped>
  @import '../styles/Perfil.css';
  </style>

