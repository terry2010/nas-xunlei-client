import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'main',
    component: () => import('../views/MainView.vue')
  },
  {
    path: '/config',
    name: 'config',
    component: () => import('../views/ConfigView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
