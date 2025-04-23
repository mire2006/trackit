<template>
  <div id="app">
    <header>
      <router-link to="/" class="logo-link">
        <img src="../assets/trackit-logo.png" alt="Track it! Logo" class="logo" />
      </router-link>
      <nav class="login-menu" v-if="$route.path === '/'">  <router-link to="/login" class="login-button">Iniciar Sesión</router-link>
      </nav>
    </header>
    <router-view></router-view>
    <footer>
      <p>
        &copy; 2025 Track it! | Mirella Ferrer | Iplacex | Todos los derechos
        reservados.
      </p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'LayoutVista',
};
</script>

<style>
@import '../styles/App.css';
</style>

