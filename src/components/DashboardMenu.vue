<template>
  <nav class="dashboard-menu">
    <ul>
      <li><router-link to="/dashboard" @click="cerrarMenusDesplegables">Perfil de Usuario</router-link></li>

      <li v-if="puedeVerClientes">
        <router-link to="/clientes" @click="cerrarMenusDesplegables">Gestión de Clientes</router-link>
      </li>

      <li v-if="puedeVerGestionBombas" class="dropdown-container">
        <a @click.prevent="toggleBombasMenu" href="#" class="dropdown-toggle">
          Gestión de Bombas <span class="dropdown-arrow" :class="{ 'open': bombasMenuAbierto }">▼</span>
        </a>
        <ul v-if="bombasMenuAbierto" class="dropdown-menu-items">
          <li>
            <router-link to="/bombas" @click="cerrarMenusDesplegables">Lista de Bombas</router-link>
          </li>
          <li v-if="esAdmin || esOperador">
            <router-link to="/bombas/tipos" @click="cerrarMenusDesplegables">Gestionar Tipos de Bomba</router-link>
          </li>
        </ul>
      </li>
      <li v-if="puedeVerReparaciones">
        <router-link to="/reparaciones" @click="cerrarMenusDesplegables">Gestión de Reparaciones</router-link>
      </li>

      <li v-if="esAdmin">
        <router-link to="/usuarios" @click="cerrarMenusDesplegables">Gestión de Usuarios</router-link>
      </li>

      <li><button @click="logout">Cerrar Sesión</button></li>
    </ul>
  </nav>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const userRole = ref(null);
const router = useRouter();
const route = useRoute();

const bombasMenuAbierto = ref(false);

const obtenerRolUsuario = () => {
  const userData = localStorage.getItem('usuario');
  if (userData) {
    try {
      userRole.value = JSON.parse(userData).Rol;
    } catch (e) {
      console.error("Error al analizar datos de usuario:", e);
      userRole.value = null;
    }
  } else {
    userRole.value = null;
  }
};

onMounted(() => {
  obtenerRolUsuario();
});

const esAdmin = computed(() => userRole.value === 'administrador');
const esOperador = computed(() => userRole.value === 'operador');

const puedeVerClientes = computed(() => esAdmin.value || esOperador.value);
const puedeVerGestionBombas = computed(() => esAdmin.value || esOperador.value);
const puedeVerReparaciones = computed(() => esAdmin.value || esOperador.value);

const toggleBombasMenu = () => {
  bombasMenuAbierto.value = !bombasMenuAbierto.value;
};

const cerrarMenusDesplegables = () => {
  bombasMenuAbierto.value = false;
};

watch(() => route.path, () => {
  cerrarMenusDesplegables();
});

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  userRole.value = null;
  router.push('/login').then(() => {
  });
};
</script>

<style scoped>

.dashboard-menu {
  background-color: #f4f4f4;
  padding: 10px 0;
  border-radius: 5px;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  z-index: 100;
}

.dashboard-menu ul {
  display: flex;
  justify-content: center;
  list-style: none;
  padding: 0;
  margin: 0;
  align-items: center;
}

.dashboard-menu li {
  margin: 0 5px;
}

.dashboard-menu a,
.dashboard-menu .dropdown-toggle {
  text-decoration: none;
  color: #4e4b4c;
  display: inline-block;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease;
  cursor: pointer;
}

.dashboard-menu a:hover,
.dashboard-menu .dropdown-toggle:hover,
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

.dropdown-container {
  position: relative;
}

.dropdown-toggle .dropdown-arrow {
  display: inline-block;
  margin-left: 5px;
  font-size: 0.8em;
  transition: transform 0.2s ease-in-out;
}
.dropdown-toggle .dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu-items {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #f9f9f9;
  min-width: 220px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 101; 
  border-radius: 4px;
  padding: 5px 0;
  margin-top: 5px;
  display: flex; 
  flex-direction: column;
  list-style: none;
}

.dropdown-menu-items li {
    width: 100%;
    margin: 0;
}

.dropdown-menu-items a {
  color: #333;
  padding: 10px 15px;
  text-decoration: none;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.dropdown-menu-items a:hover {
  background-color: #e0e0e0;
  color: #000;
}
</style>
