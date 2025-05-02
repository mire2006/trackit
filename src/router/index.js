import { createRouter, createWebHistory } from 'vue-router';
import LayoutVista from '../components/LayoutVista.vue';
import InicioVista from '../views/InicioVista.vue';
import LoginVista from '../views/LoginVista.vue';
import ClientesVista from '../views/ClientesVista.vue';
import BombasVista from '../views/BombasVista.vue';
import ReparacionesVista from '../views/ReparacionesVista.vue';
import UsuariosVista from '../views/UsuariosVista.vue';
import ReparacionDetalle from '../views/ReparacionDetalle.vue';
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
    ],
  });

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

  const usuarioDataString = localStorage.getItem('usuario');
  let isAuthenticated = false;
  let userRole = null;
  let usuarioData = null;

  if (usuarioDataString) {
    try {
      usuarioData = JSON.parse(usuarioDataString);
      userRole = usuarioData ? usuarioData.Rol : null;
      isAuthenticated = !!userRole; 
    } catch (e) {
      console.error("Error al analizar datos de usuario desde localStorage", e);
      localStorage.removeItem('usuario'); 
      isAuthenticated = false;
      userRole = null;
    }
  }

  const allowedRolesMeta = to.matched.find(record => record.meta.roles);
  const allowedRoles = allowedRolesMeta ? allowedRolesMeta.meta.roles : null;

  console.log(`NAV GUARD: To=${to.path}, From=${from.path}, requiresAuth=${requiresAuth}, 
              requiresGuest=${requiresGuest}, isAuthenticated=${isAuthenticated}, Role=${userRole}`);

  if (requiresGuest && isAuthenticated) {
    console.log('Guardia: Usuario autenticado intentando acceder a ruta de invitado. Redirigiendo a /dashboard.');
    return next({ name: 'dashboard' }); 
  }

  if (requiresAuth && !isAuthenticated) {
    console.log('Guardia: Usuario no autenticado intentando acceder a ruta protegida. Redirigiendo a /login.');
    if (to.name === 'login') {
      return next(); 
    }
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (requiresAuth && isAuthenticated && allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`Guardia: Rol '${userRole}' no autorizado para ${to.path}. Redirigiendo a /dashboard.`);
    if (to.name === 'dashboard') {
       console.warn("Guardia: Chequeo de rol falló incluso para /dashboard. ¿Rol inválido? Forzando logout.");
       localStorage.removeItem('usuario');
       return next({ name: 'login' });
    }
    return next({ name: 'dashboard' }); 
  }

  console.log(`Guardia: Acceso permitido a ${to.path}.`);
  return next();
});

export default router;

