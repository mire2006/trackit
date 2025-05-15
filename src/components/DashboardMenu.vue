<template>
  <nav class="dashboard-menu">
    <ul>
      <li><router-link to="/dashboard" @click="cerrarTodosLosMenus">Perfil de Usuario</router-link></li>

      <li v-if="puedeVerClientes">
        <router-link to="/clientes" @click="cerrarTodosLosMenus">Gestión de Clientes</router-link>
      </li>

      <li v-if="puedeVerGestionBombas" class="dropdown-container">
        <a @click.prevent="toggleMenu('bombas')" href="#" class="dropdown-toggle">
          Gestión de Bombas <span class="dropdown-arrow" :class="{ 'open': menuAbierto === 'bombas' }">▼</span>
        </a>
        <ul v-if="menuAbierto === 'bombas'" class="dropdown-menu-items">
          <li>
            <router-link :to="{ name: 'bombas' }" @click="cerrarTodosLosMenus">Lista de Bombas</router-link>
          </li>
          <li v-if="esAdmin || esOperador">
            <router-link :to="{ name: 'tiposBomba' }" @click="cerrarTodosLosMenus">Gestionar Tipos de Bomba</router-link>
          </li>
        </ul>
      </li>

      <li v-if="puedeVerReparaciones" class="dropdown-container">
        <a @click.prevent="toggleMenu('reparaciones')" href="#" class="dropdown-toggle">
          Gestión de Reparaciones <span class="dropdown-arrow" :class="{ 'open': menuAbierto === 'reparaciones' }">▼</span>
        </a>
        <ul v-if="menuAbierto === 'reparaciones'" class="dropdown-menu-items">
          <li>
            <router-link :to="{ name: 'ingresoReparaciones' }" @click="cerrarTodosLosMenus">Ingreso de Reparaciones</router-link>
          </li>
          <li>
            <router-link :to="{ name: 'historicoReparaciones' }" @click="cerrarTodosLosMenus">Informe Histórico</router-link>
          </li>
        </ul>
      </li>

      <li v-if="esAdmin">
        <router-link to="/usuarios" @click="cerrarTodosLosMenus">Gestión de Usuarios</router-link>
      </li>

      <li><button @click="logout">Cerrar Sesión</button></li>
    </ul>
  </nav>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from '@/axios'; 

const userRole = ref(null);
const router = useRouter();
const route = useRoute();

const menuAbierto = ref(null);

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

const toggleMenu = (menu) => {
  if (menuAbierto.value === menu) {
    menuAbierto.value = null;
  } else {
    menuAbierto.value = menu;
  }
};

const cerrarTodosLosMenus = () => {
  menuAbierto.value = null;
};

watch(() => route.path, () => {
  cerrarTodosLosMenus();
});

const logout = async () => {
  try {
    await axios.post('/usuarios/logout');
  } catch (error) {
    console.error("Error al cerrar sesión en el backend:", error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    userRole.value = null;
    router.push('/login');
  }
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
.dashboard-menu a.router-link-exact-active,
.dashboard-menu .dropdown-menu-items a.router-link-active.router-link-exact-active {
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
