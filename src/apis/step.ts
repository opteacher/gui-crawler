import Step from '@/types/step'
import router from '@/router'
import { reqAll, reqDelete, reqLink, reqPost, reqPut, RequestOptions } from '@lib/utils'
import BinMap from '@/types/binMap'

const ignores = ['fkTask', 'rect', 'icon', 'color', 'addMode']

export default {
  add: async (form: any, tid = router.currentRoute.value.params.tid) => {
    const ret = await reqPost<Step>('step', form, { copy: Step.copy, ignores })
    await reqLink({ parent: ['step', ret.key], child: ['fkTask', tid] })
    return ret
  },
  remove: (step: Step) => reqDelete('step', step.key),
  update: (step: Step) => reqPut<Step>('step', step.key, step, { ignores, copy: Step.copy }),
  all: (options?: RequestOptions, tid = router.currentRoute.value.params.tid) =>
    reqAll<Step>('step', {
      ...(options || {}),
      copy: Step.copy,
      axiosConfig: { params: { fkTask: tid } }
    }),
  collect: (sid: string) => ({
    bind: (binMap: BinMap) =>
      reqPut(
        'step',
        sid,
        { 'extra.binMaps': binMap },
        { axiosConfig: { params: { _updMode: 'append' } } }
      ),
    unbind: (binMap: BinMap) =>
      reqPut(
        'step',
        sid,
        { 'extra.binMaps': binMap },
        { axiosConfig: { params: { _updMode: 'delete' } } }
      )
  })
}
