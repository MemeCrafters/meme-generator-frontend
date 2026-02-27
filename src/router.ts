import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    // Don't scroll to top when returning to cached MemeList
    if (to.name === 'home' && from.name === 'meme') {
      return false
    }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/MemeList.vue'),
    },
    {
      path: '/meme/:memeKey',
      name: 'meme',
      component: () => import('./views/MemeGenerator.vue'),
      props: true,
    },
  ],
})

export default router
