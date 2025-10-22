<template>
  <div class="h-full flex flex-col">
    <a-page-header :title="task?.name" :sub-title="curStep?.title" @back="() => router.back()" />
    <PgEleSelect
      class="flex-1"
      ref="pgElSelRef"
      :curURL="url"
      v-model:loading="loading"
      :hl-eles="hlEles"
      :sbar-wid="500"
      :emitter="emitter"
      @update:sel-ele="onEleSelect"
    >
      <template #sideBottom>
        <FormGroup :disabled="loading" class="p-5" :mapper="mapper" :form="curStep?.extra">
          <template v-if="curStep?.stype === 'collect'" #container>
            <EleSelField
              :form="curStep.extra"
              prop="container"
              :selProp="selProp"
              :selEle="pgElSelRef?.selEle"
              @sel-ele-start="onSelElStart"
              @sel-ele-clear="onSelElClear"
              @ele-iden-change="onElIdChange"
            />
          </template>
          <template v-if="curStep?.stype === 'collect'" #item>
            <EleSelField
              :form="curStep.extra"
              prop="item"
              :selProp="selProp"
              :selEle="pgElSelRef?.selEle"
              @sel-ele-start="onSelElStart"
              @sel-ele-clear="onSelElClear"
              @ele-iden-change="onElIdChange"
            />
          </template>
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
import Step, { mapperDict, Stype } from '@/types/step'
import stpAPI from '@/apis/step'
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper from '@lib/types/mapper'
import { TinyEmitter } from 'tiny-emitter'
import { getProp, pickOrIgnore, setProp } from '@lib/utils'
import PageEle from '@lib/types/pageEle'
import EleSelField from '@/components/eleSelField.vue'
import EleColcField from '@/components/eleColcField.vue'
import MetaObj from '@/types/metaObj'
import BinMap from '@/types/binMap'

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
const selProp = ref<string>('')
const hlEles = computed(() =>
  [
    getProp(curStep.value, 'extra.container.xpath'),
    getProp(curStep.value, 'extra.item.xpath'),
    ...getProp(curStep.value, 'extra.binMaps', []).map((bm: BinMap) => bm.element.xpath)
  ].filter(v => v)
)
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
  const step = stpDict.value[stpKey]
  const stpMapper = mapperDict[step.stype as Stype]()
  if (step.stype === 'collect') {
    setProp(stpMapper, 'container.onClick', () => onSelElStart('container'))
    setProp(stpMapper, 'item.onClick', () => onSelElStart('item'))
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
async function onEleSelect(selEle?: PageEle) {
  switch (true) {
    case curStep.value && curStep.value.stype === 'collect':
      if (selEle) {
        if (selProp.value) {
          if (!route.params.sid) {
            return
          }
          const sid = route.params.sid as string
          setProp(stpDict.value, `${sid}.extra.${selProp.value}`, selEle)
          await updateStepExtra()
          selProp.value = ''
        }
        emitter.emit('ele-selected', selEle)
      }
      break
  }
}
function onSelElStart(prop: string) {
  emitter.emit('sel-ele')
  selProp.value = selProp.value ? '' : prop
}
async function onSelElClear(prop: string) {
  if (!route.params.sid) {
    return
  }
  const sid = route.params.sid as string
  getProp(stpDict.value, `${sid}.extra.${prop}`)?.reset()
  await updateStepExtra()
  emitter.emit('clr-ele')
}
async function onElIdChange(prop: string, iden: string) {
  if (!route.params.sid) {
    return
  }
  const sid = route.params.sid as string
  setProp(stpDict.value, `${sid}.extra.${prop}.idType`, iden)
  await updateStepExtra()
}
function updateStepExtra(sid = route.params.sid as string) {
  return stpAPI.update(pickOrIgnore(stpDict.value[sid], ['key', 'extra'], false))
}
</script>
