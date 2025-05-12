import { createRouter, createWebHistory } from 'vue-router';
import LayoutVista from '../components/LayoutVista.vue';
import InicioVista from '../views/InicioVista.vue';
import LoginVista from '../views/LoginVista.vue';
import DashboardVista from '../views/DashboardVista.vue';
import ClientesVista from '../views/ClientesVista.vue';
import BombasVista from '../views/BombasVista.vue';
import TiposBombaVista from '../views/TiposBombaVista.vue';
import ReparacionesVista from '../views/ReparacionesVista.vue';
import HistoricoReparacionesVista from '../views/HistoricoReparacionesVista.vue';
import ReparacionDetalle from '../views/ReparacionDetalle.vue';
import UsuariosVista from '../views/UsuariosVista.vue';
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
          meta: { requiresGuest: true }
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
      path: '/dashboard',
      component: LayoutVista,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardVista,
          meta: {
            requiresAuth: true,
            roles: ['administrador', 'operador', 'tecnico']
          },
        },
      ],
    },
    {
      path: '/clientes',
      component: LayoutVista,
      meta: { requiresAuth: true, roles: ['administrador', 'operador'] },
      children: [
        {
          path: '',
          name: 'clientes',
          component: ClientesVista,
        },
      ],
    },
    {
      path: '/bombas', 
      component: LayoutVista,
      meta: { requiresAuth: true, roles: ['administrador', 'operador'] },
      children: [
        {
          path: '',
          name: 'bombas',
          component: BombasVista,
        },
        {
          path: 'tipos',
          name: 'tiposBomba',
          component: TiposBombaVista,
        }
      ]
    },
    {
      path: '/reparaciones',
      component: LayoutVista,
      redirect: { name: 'ingresoReparaciones' },
      children: [
        {
          path: 'ingreso', 
          name: 'ingresoReparaciones',
          component: ReparacionesVista,
          meta: { requiresAuth: true, roles: ['administrador', 'operador'] },
        },
        {
          path: 'historico',
          name: 'historicoReparaciones',
          component: HistoricoReparacionesVista,
          meta: { requiresAuth: true, roles: ['administrador', 'operador'] },
        },
        {
          path: 'bomba/:id',
          name: 'reparacionDetalle',
          component: ReparacionDetalle,
          meta: { requiresAuth: false }
        }
      ],
    },
    {
      path: '/usuarios',
      component: LayoutVista,
      meta: { requiresAuth: true, roles: ['administrador'] },
      children: [
        {
          path: '',
          name: 'usuarios',
          component: UsuariosVista,
        },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

  const usuarioDataString = localStorage.getItem('usuario');
  let isAuthenticated = false;
  let userRole = null;

  if (usuarioDataString) {
    try {
      const datosUsuario = JSON.parse(usuarioDataString);
      userRole = datosUsuario ? datosUsuario.Rol : null;
      isAuthenticated = !!userRole;
    } catch (e) {
      localStorage.removeItem('usuario');
      isAuthenticated = false;
      userRole = null;
    }
  }

  let allowedRoles = null;
  for (let i = to.matched.length - 1; i >= 0; i--) {
    if (to.matched[i].meta.roles) {
      allowedRoles = to.matched[i].meta.roles;
      break; 
    }
  }
  
  if (requiresGuest && isAuthenticated) {
    return next({ name: 'dashboard' });
  }

  if (requiresAuth && !isAuthenticated) {
    if (to.name === 'login') {
      return next();
    }
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (requiresAuth && isAuthenticated && allowedRoles) {
    if (!allowedRoles.includes(userRole)) {
      return next({ name: 'dashboard' }); 
    }
  }
  
  return next();
});

export default router;
