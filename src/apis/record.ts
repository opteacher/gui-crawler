import router from '@/router'
import { reqAll, reqLink, reqPost } from '@lib/utils'
import Record from '@/types/record'

export default (tid = router.currentRoute.value.params.tid) => ({
  all: () => reqAll<Record>('record', { copy: Record.copy, axiosConfig: { params: { fkTask: tid } } }),
  add: async (form: any, moKey: string) => {
    const ret = await reqPost<Record>('record', form, { copy: Record.copy })
    await reqLink({ parent: ['record', ret.key], child: ['fkTask', tid] })
    await reqLink({ parent: ['record', ret.key], child: ['fkMetaobj', moKey] })
    return ret
  }
})
