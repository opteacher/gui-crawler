import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import ListTasks from './views/listTasks.vue'
import EditStep from './views/editStep.vue'
import OperFlow from './views/operFlow.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/gui-crawler/task/s'
  },
  {
    path: '/gui-crawler/task/s',
    name: 'ListTasks',
    component: ListTasks
  },
  {
    path: '/gui-crawler/task/:tid/flow/oper',
    name: 'OperFlow',
    component: OperFlow
  },
  {
    path: '/gui-crawler/task/:tid/step/:sid/edit',
    name: 'EditStep',
    component: EditStep
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
