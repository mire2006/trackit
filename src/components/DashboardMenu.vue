<template>
  <nav class="dashboard-menu">
    <ul>
      <li><router-link to="/dashboard">Perfil de Usuario</router-link></li>

      <li v-if="userRole === 'administrador' || userRole === 'operador'">
        <router-link to="/clientes">Gestión de Clientes</router-link>
      </li>
      <li v-if="userRole === 'administrador' || userRole === 'operador'">
        <router-link to="/bombas">Gestión de Bombas</router-link>
      </li>
      <li v-if="userRole === 'administrador' || userRole === 'operador'">
        <router-link to="/reparaciones">Gestión de Reparaciones</router-link>
      </li>

      <li v-if="userRole === 'administrador'">
        <router-link to="/usuarios">Gestión de Usuarios</router-link>
      </li>

      <li><button @click="logout">Cerrar Sesión</button></li>

    </ul>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const userRole = ref(null);
const router = useRouter();

onMounted(() => {
  const userData = localStorage.getItem('usuario');
  if (userData) {
    try {
      userRole.value = JSON.parse(userData).Rol;
      console.log('Rol obtenido en DashboardMenu:', userRole.value);
    } catch (e) {
      console.error("Error al analizar datos de usuario:", e);
      logout();
    }
  } else {
      console.warn("No se encontraron datos de usuario en localStorage.");
  }
});

const logout = () => {
  localStorage.removeItem('token'); // Elimina el token de sesión
  localStorage.removeItem('usuario'); // Elimina los datos del usuario
  userRole.value = null; // Resetea el rol del usuario
  router.push('/login'); // Redirige a la página de inicio de sesión
};
</script>

<style scoped>
.dashboard-menu {
  background-color: #f4f4f4;
  padding: 10px 0; 
  border-radius: 5px; 
  border-bottom: 1px solid #e0e0e0;
}

.dashboard-menu ul {
  display: flex;
  justify-content: center; 
  list-style: none;
  padding: 0;
  margin: 0;
}

.dashboard-menu li {
  margin: 0 10px; 
}

.dashboard-menu a {
  text-decoration: none;
  color: #4e4b4c;
  display: inline-block; 
  padding: 8px 12px; 
  border-radius: 4px; 
  transition: background-color 0.2s ease; 
}

.dashboard-menu a:hover,
.dashboard-menu a.router-link-exact-active {
  font-weight: bold;
  color: #000;
  background-color: #e0e0e0;
}

.dashboard-menu button {
  background: none;
  border: none;
  padding: 8px 12px; 
  margin: 0;
  color: #dc3545;
  cursor: pointer;
  text-align: left;
  font-size: inherit; 
  font-family: inherit; 
  display: inline-block; 
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.dashboard-menu button:hover {
  font-weight: bold;
  background-color: rgba(220, 53, 69, 0.1); 
}
</style>

