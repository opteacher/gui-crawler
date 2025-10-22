import router from '@/router'
import Meta from '@/types/metaObj'
import { reqDelete, reqLink, reqPost, reqPut } from '@lib/utils'

export default (tid = router.currentRoute.value.params.tid) => ({
  add: async (meta: Meta) => {
    const ret = await reqPost<Meta>('metaObj', meta, { copy: Meta.copy })
    await reqLink({ parent: ['task', tid], child: ['fkMetaobjs', ret.key] })
    return ret
  },
  remove: async (meta: Meta) => {
    await reqLink({ parent: ['task', tid], child: ['fkMetaobjs', meta.key] }, false)
    return reqDelete('metaObj', meta.key)
  },
  update: (meta: Meta) => reqPut<Meta>('metaObj', meta.key, meta, { copy: Meta.copy })
})
