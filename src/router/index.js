import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/create',
    name: 'CreateProblem',
    component: () => import('../views/CreateRouteView.vue')
  },
  {
    path: '/problems/:id',
    name: 'ProblemDetails',
    component: () => import('../views/RouteDetailsView.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 