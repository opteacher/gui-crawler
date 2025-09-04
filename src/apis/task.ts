import Task from '@/types/task'
import { reqAll, reqDelete, reqPost, reqPut } from '@lib/utils'

export default {
  all: () => reqAll('task', { copy: Task.copy }),
  add: (task: Task) => reqPost('task', task, { ignores: ['fkNode'] }),
  remove: (task: Task) => reqDelete('task', task.key),
  update: (task: Task) => reqPut('task', task.key, task, { ignores: ['fkNode'] })
}
