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
import DashboardVista from '../views/DashboardVista.vue'; 

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
  
  const allowedRolesMeta = to.matched.find(record => record.meta.roles);
  const allowedRoles = allowedRolesMeta ? allowedRolesMeta.meta.roles : null; 

  const isAuthenticated = !!localStorage.getItem('token'); 

  let userRole = null; 
  if (isAuthenticated) {
    try {
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));
      userRole = usuarioData ? usuarioData.Rol : null; 
    } catch (e) {
      console.error("Error al parsear datos de usuario desde localStorage:", e);
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      return next('/login'); 
    }
  }

  console.log(`Navegando a: ${to.path}, Requiere Auth: ${requiresAuth}, Roles Permitidos: ${allowedRoles}, Autenticado: ${isAuthenticated}, Rol Usuario: ${userRole}`);

  if (requiresAuth && !isAuthenticated) {

    console.log('Guardia: No autenticado, redirigiendo a /login');
    next('/login');
  } else if (requiresAuth && allowedRoles && !allowedRoles.includes(userRole)) {

    console.log(`Guardia: Rol '${userRole}' no autorizado para ${to.path}. Redirigiendo a /dashboard`);
    next('/dashboard'); 
  } else {

    console.log(`Guardia: Acceso permitido a ${to.path}`);
    next();
  }
});

export default router;

