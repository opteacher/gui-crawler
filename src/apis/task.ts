import Task from '@/types/task'
import { reqAll, reqDelete, reqGet, reqPost, reqPut } from '@lib/utils'

export default {
  all: () => reqAll('task', { type: 'api', copy: Task.copy, messages: { notShow: true } }),
  add: (task: Task) => reqPost('task', task, { ignores: ['fkNode'] }),
  remove: (task: Task) => reqDelete('task', task.key),
  update: (task: Task) => reqPut('task', task.key, task, { ignores: ['fkNode'] }),
  get: (tid: string) => reqGet<Task>('task', tid, { copy: Task.copy }),
  start: (task: Task) =>
    reqPut('task', task.key, task, { type: 'api', ignores: ['fkNode'], action: 'start' }),
  stop: (task: Task) => reqDelete('task', task.key, { type: 'api', action: 'stop' }),
  getJob: (name: string) =>
    reqGet('job', undefined, {
      type: 'api',
      action: 'job',
      axiosConfig: { params: { name } }
    })
}
