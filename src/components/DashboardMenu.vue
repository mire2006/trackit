<template>
    <nav class="dashboard-menu">
      <h3>Menú Principal</h3>
      <ul>
        <li><router-link to="/dashboard">Inicio Dashboard</router-link></li> 
  
        <li v-if="userRole === 'administrador' || userRole === 'operador'">
          <router-link to="/clientes">Gestión Clientes</router-link>
        </li>
        <li v-if="userRole === 'administrador' || userRole === 'operador'">
          <router-link to="/bombas">Gestión Bombas</router-link>
        </li>
        <li v-if="userRole === 'administrador' || userRole === 'operador'">
          <router-link to="/reparaciones">Gestión Reparaciones</router-link>
        </li>
  
        <li v-if="userRole === 'administrador'">
          <router-link to="/usuarios">Gestión Usuarios</router-link>
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
        console.error("Error al parsear datos de usuario:", e);
        logout(); 
      }
    } else {
        console.warn("No se encontraron datos de usuario en localStorage.");
        logout();
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
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    text-align: left;
  }
  
  .dashboard-menu h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
  }
  
  .dashboard-menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .dashboard-menu li {
    margin-bottom: 8px;
  }
  
  .dashboard-menu a {
    text-decoration: none;
    color: #4e4b4c;
    display: block;
    padding: 5px 0;
  }
  
  .dashboard-menu a:hover, 
  .dashboard-menu a.router-link-exact-active { 
    font-weight: bold;
    color: #000;
  }
  
  .dashboard-menu button {
    background: none;
    border: none;
    padding: 5px 0;
    margin: 0;
    color: #dc3545; 
    cursor: pointer;
    text-align: left;
    font-size: inherit; 
  }
  
  .dashboard-menu button:hover {
    text-decoration: underline;
    font-weight: bold;
  }
  </style>

  