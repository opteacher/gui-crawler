import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import ListTasks from './views/listTasks.vue'
import EditCrawl from './views/editCrawl.vue'
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
    path: '/gui-crawler/task/:tid/oper/flow',
    name: 'OperFlow',
    component: OperFlow
  },
  {
    path: '/gui-crawler/task/:tid/crawl/edit',
    name: 'EditCrawl',
    component: EditCrawl
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
