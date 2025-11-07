import Task from '@/types/task'
import { reqAll, reqDelete, reqGet, reqPost, reqPut } from '@lib/utils'
import stpAPI from './step'
import metaAPI from './meta'

export default {
  all: () => reqAll('task', { type: 'api', copy: Task.copy, messages: { notShow: true } }),
  add: (task: Task) => reqPost('task', task, { ignores: ['fkNode'] }),
  remove: async (task: Task) => {
    const steps = await stpAPI.all()
    await Promise.all(
      task.fkMetaobjs.map(mo => metaAPI(task.key).remove(typeof mo === 'string' ? { key: mo } : mo))
    )
    await Promise.all(steps.map(stp => stpAPI.remove(stp)))
    return reqDelete('task', task.key)
  },
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
    }),
  getCode: (tid: string) => reqGet('task', tid, { type: 'api', action: 'code' })
}
