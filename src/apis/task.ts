import Task from '@/types/task'
import { reqAll, reqDelete, reqGet, reqPost, reqPut } from '@lib/utils'

export default {
  all: () => reqAll('task', { copy: Task.copy }),
  add: (task: Task) => reqPost('task', task, { ignores: ['fkNode'] }),
  remove: (task: Task) => reqDelete('task', task.key),
  update: (task: Task) => reqPut('task', task.key, task, { ignores: ['fkNode'] }),
  start: (task: Task) =>
    reqPut('task', task.key, task, { type: 'api', ignores: ['fkNode'], action: 'start' }),
  stop: (task: Task) => reqDelete('task', task.key, { type: 'api', action: 'stop' }),
  getJob: (task: Task) => reqGet('job', task.key, { type: 'api', action: 'job' })
}
