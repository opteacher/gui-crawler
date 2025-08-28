import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import ListTasks from './views/listTasks.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/gui-crawler/task/s'
  },
  {
    path: '/gui-crawler/task/s',
    name: 'ListTasks',
    component: ListTasks
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
