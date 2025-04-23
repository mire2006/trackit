import { createRouter, createWebHistory } from 'vue-router';
import LayoutVista from '../components/LayoutVista.vue'; 
import InicioVista from '../views/InicioVista.vue';
import LoginVista from '../views/LoginVista.vue';
import ClientesVista from '../views/ClientesVista.vue';
import BombasVista from '../views/BombasVista.vue';
import ReparacionesVista from '../views/ReparacionesVista.vue';
import UsuariosVista from '../views/UsuariosVista.vue';
import ReparacionDetalle from '../views/ReparacionDetalle.vue';
import HistoricoReparaciones from '../views/HistoricoReparaciones.vue';
import RecuperacionContrasenaVista from '../views/RecuperacionContrasenaVista.vue'; 

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: LayoutVista, 
      children: [
        {
          path: '',
          name: 'inicio',
          component: InicioVista, 
        },
      ],
    },
    {
      path: '/login',
      component: LayoutVista,
      children: [
        {
          path: '',
          name: 'login',
          component: LoginVista,
        },
      ],
    },
    {
      path: '/recuperar-contrasena', 
      component: LayoutVista,
      children: [
        {
          path: '',
          name: 'recuperar-contrasena',
          component: RecuperacionContrasenaVista,
        },
      ],
    },
    {
      path: '/clientes',
      component: LayoutVista,
      children: [
        {
          path: '',
          name: 'clientes',
          component: ClientesVista,
          meta: { requiresAuth: true, roles: ['administrador', 'operador'] },
        },
      ],
    },
    {
      path: '/bombas',
      component: LayoutVista,
      children: [
        {
          path: '',
          name: 'bombas',
          component: BombasVista,
          meta: { requiresAuth: true, roles: ['administrador', 'operador'] },
        },
      ],
    },
    {
      path: '/reparaciones',
      component: LayoutVista,
      children: [
        {
          path: '',
          name: 'reparaciones',
          component: ReparacionesVista,
          meta: { requiresAuth: true, roles: ['administrador', 'operador'] },
        },
      ],
    },
    {
      path: '/usuarios',
      component: LayoutVista,
      children: [
        {
          path: '',
          name: 'usuarios',
          component: UsuariosVista,
          meta: { requiresAuth: true, roles: ['administrador'] },
        },
      ],
    },
    {
      path: '/reparaciones/bomba/:id',
      component: LayoutVista,
      children: [
        {
          path: '',
          name: 'reparacionDetalle',
          component: ReparacionDetalle,
          meta: {
            requiresAuth: true,
            roles: ['administrador', 'operador', 'tecnico'],
          },
        },
      ],
    },
    {
      path: '/historico/bomba/:id',
      component: LayoutVista,
      children: [
        {
          path: '',
          name: 'historicoReparaciones',
          component: HistoricoReparaciones,
          meta: {
            requiresAuth: true,
            roles: ['administrador', 'operador', 'tecnico'],
          },
        },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth); 
  const allowedRoles = to.matched.some(record => record.meta.roles); 
  const isAuthenticated = localStorage.getItem('token');

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (requiresAuth && isAuthenticated && allowedRoles && !to.matched.some(record => record.meta.roles.includes(JSON.parse(localStorage.getItem('usuario')).Rol))) {
    next('/');
  } else {
    next();
  }
});

export default router;

