<template>
  <div class="h-full flex flex-col">
    <a-page-header :title="task?.name" :sub-title="curStep?.title" @back="() => router.back()" />
    <PgEleSelect
      class="flex-1"
      ref="pgElSelRef"
      :url="url"
      v-model:loading="loading"
      :hl-eles="hlEles"
      :sbar-wid="500"
      :emitter="emitter"
    >
      <template #sideBottom>
        <FormGroup
          :disabled="loading"
          class="p-5 overflow-auto"
          :mapper="mapper"
          :form="curStep?.extra"
        >
          <template v-if="curStep?.stype === 'collect'" #binMaps>
            <EleColcField
              :emitter="emitter"
              :meta-objs="metaObjs"
              :webview="pgElSelRef?.webviewRef"
              :step-extra="curStep.extra"
              @ele-meta-bind="() => updateStepExtra()"
              @ele-meta-unbind="() => updateStepExtra()"
            />
          </template>
        </FormGroup>
      </template>
    </PgEleSelect>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PgEleSelect from '@lib/components/PgEleSelect.vue'
import { useRoute, useRouter } from 'vue-router'
import Task from '@/types/task'
import tskAPI from '@/apis/task'
import Step, { CollectExtra } from '@/types/step'
import stpAPI from '@/apis/step'
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper from '@lib/types/mapper'
import { TinyEmitter } from 'tiny-emitter'
import { getProp, pickOrIgnore, setProp } from '@lib/utils'
import EleColcField from '@/components/eleColcField.vue'
import MetaObj from '@/types/metaObj'
import BinMap from '@/types/binMap'
import { Cond } from '@lib/types'
import PageEle from '@lib/types/pageEle'

const route = useRoute()
const router = useRouter()
const url = ref('')
const pgElSelRef = ref<InstanceType<typeof PgEleSelect>>()
const task = ref<Task>()
const stpDict = ref<Record<string, Step>>({})
const mapper = ref<Mapper>(new Mapper({}))
const emitter = new TinyEmitter()
const loading = ref(false)
const curStep = computed<Step | undefined>(() => getProp(stpDict.value, route.params.sid as string))
const hlEles = computed(() => {
  const step = getProp(stpDict.value, route.params.sid as string)
  return Object.fromEntries(
    [
      ['采集容器', getProp(step, 'extra.container.xpath')],
      ['采集项', getProp(step, 'extra.item.xpath')],
      ...getProp(step, 'extra.binMaps', []).map((bm: BinMap) => [bm.desc, bm.element.xpath])
    ].filter(([_k, v]) => v)
  )
})
const metaObjs = computed(() => task.value?.fkMetaobjs as MetaObj[])

onMounted(refresh)

async function refresh() {
  loading.value = true
  const tskKey = route.params.tid as string
  task.value = await tskAPI.get(tskKey)
  const steps = await stpAPI.all({ axiosConfig: { params: { fkTask: tskKey } } })
  stpDict.value = Object.fromEntries(steps.map(s => [s.key, s] as const))
  const stpKey = route.params.sid as string
  if (!steps.length) {
    return
  }
  // 执行到当前步骤
  for (let i = 0; i < steps.length; ++i) {
    const step = steps[i]
    if (i !== 0 && step.key === stpKey) {
      break
    }
    switch (step.stype) {
      case 'goto':
        url.value = step?.extra.url
        break
      case 'opera':
        break
    }
  }
  let stpMapper = {}
  switch (curStep.value?.stype) {
    case 'goto':
      stpMapper = {
        url: {
          type: 'Input',
          label: '地址',
          rules: [{ required: true, message: '必须输入网站地址！' }]
        },
        newPage: {
          type: 'Switch',
          label: '新页面打开'
        }
      }
      break
    case 'collect':
      stpMapper = {
        container: {
          type: 'PageEleSel',
          label: '采集容器',
          emitter,
          selEle: pgElSelRef.value?.selEle,
          placeholder: '将跳转到页面选择元素',
          disabled: [Cond.create('key', '==', '')],
          onSelEleClear,
          onEleIdenChange
        },
        item: {
          type: 'PageEleSel',
          label: '采集项',
          emitter,
          selEle: pgElSelRef.value?.selEle,
          placeholder: '将跳转到页面选择元素',
          disabled: [Cond.create('key', '==', '')],
          onSelEleClear,
          onEleIdenChange
        },
        binMaps: {
          type: 'Button',
          inner: '添加采集项',
          label: '采集表',
          placeholder: '将跳转到页面选择元素',
          fullWid: true,
          disabled: [Cond.create('key', '==', '')]
        },
        strategy: {
          type: 'Radio',
          label: '采集策略',
          options: [
            { label: '采集当页所有', value: 'all' },
            { label: '只采第一条', value: 'first' }
          ],
          style: 'button'
        }
      }
      genBinMapDesc(task.value.fkMetaobjs as MetaObj[], curStep.value.extra)
      break
  }
  mapper.value = new Mapper({
    ...stpMapper,
    execute: {
      type: 'Button',
      offset: 4,
      inner: '预览该步骤',
      fullWid: true,
      ghost: false
    }
  })
}
async function onSelEleClear(prop: string) {
  if (!route.params.sid) {
    return
  }
  const sid = route.params.sid as string
  setProp(stpDict.value, `${sid}.extra.${prop}`, new PageEle())
  await updateStepExtra()
  emitter.emit('stop-select')
}
async function onEleIdenChange(prop: string, iden: string) {
  if (!route.params.sid) {
    return
  }
  const sid = route.params.sid as string
  setProp(stpDict.value, `${sid}.extra.${prop}.idType`, iden)
  await updateStepExtra()
}
async function updateStepExtra(sid = route.params.sid as string) {
  return stpAPI.update(pickOrIgnore(stpDict.value[sid], ['key', 'extra'], false))
}
function genBinMapDesc(metaObjs: MetaObj[], colcExtra: CollectExtra) {
  for (const binMap of colcExtra.binMaps) {
    const metaObj = metaObjs.find(mo => mo.key === binMap.metaObj)
    const binProp = metaObj?.propers.find(p => p.key === binMap.proper)
    binMap.desc = `${metaObj?.label}.${binProp?.label}`
  }
}
</script>
