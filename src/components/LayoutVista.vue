<template>
  <div id="app-layout"> 
    <header>
      <router-link :to="isLoggedIn ? '/dashboard' : '/'" class="logo-link">
        <img src="../assets/trackit-logo.png" alt="Track it! Logo" class="logo" />
      </router-link>

      <div class="header-right"> 
        <nav class="login-menu" v-if="!isLoggedIn && route.path !== '/login'"> 
          <router-link to="/login" class="login-button">Iniciar Sesión</router-link>
        </nav>

        <DashboardMenu v-if="isLoggedIn" />
      </div>
    </header>

    <main> 
      <router-view></router-view>
    </main>

    <footer>
      <p>
        &copy; 2025 Track it! | Mirella Ferrer | Iplacex | Todos los derechos
        reservados.
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import DashboardMenu from '@/components/DashboardMenu.vue'; 

const isLoggedIn = ref(false);
const route = useRoute(); 

const checkAuthStatus = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('usuario');
  isLoggedIn.value = !!token && !!userData; 
  console.log('Estado LoggedIn en Layout:', isLoggedIn.value);
};

onMounted(() => {
  checkAuthStatus();
});


watch(
  () => route.path,
  () => {
    checkAuthStatus();
  }
);

</script>

<style>

#app-layout { 
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex-grow: 1; 
}

.header-right {
  margin-left: auto; 
  display: flex;
  align-items: center; 
}

.login-menu {
  margin-left: 0; 
}

</style>

