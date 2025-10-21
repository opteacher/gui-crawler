<template>
  <div class="h-full flex flex-col">
    <a-page-header :title="task?.name" :sub-title="task?.desc" @back="() => router.back()" />
    <PgEleSelect
      class="flex-1"
      ref="pgElSelRef"
      :curURL="url"
      v-model:loading="loading"
      :sbar-wid="500"
      :emitter="emitter"
      @update:sel-ele="onEleSelect"
    >
      <template #sideBottom>
        <FormGroup :disabled="loading" class="p-5" :mapper="mapper" :form="curStep?.extra">
          <template v-if="curStep?.stype === 'collect'" #colcCtnr>
            <EleSelField
              :form="curStep.extra"
              prop="colcCtnr"
              :selProp="selProp"
              @sel-ele-start="onSelElStart"
              @sel-ele-clear="onSelElClear"
              @ele-iden-change="onElIdChange"
            />
          </template>
          <template v-if="curStep?.stype === 'collect'" #colcItem>
            <EleSelField
              :form="curStep.extra"
              prop="colcItem"
              :selProp="selProp"
              @sel-ele-start="onSelElStart"
              @sel-ele-clear="onSelElClear"
              @ele-iden-change="onElIdChange"
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
import Step, { mapperDict } from '@/types/step'
import stpAPI from '@/apis/step'
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper from '@lib/types/mapper'
import { TinyEmitter } from 'tiny-emitter'
import { getProp, pickOrIgnore, setProp, swchBoolProp } from '@lib/utils'
import PageEle from '@lib/types/pageEle'
import EleSelField from '@/components/eleSelField.vue'

const route = useRoute()
const router = useRouter()
const url = ref('')
const pgElSelRef = ref()
const task = ref<Task>()
const stpDict = ref<Record<string, Step>>({})
const mapper = ref<Mapper>(new Mapper({}))
const emitter = new TinyEmitter()
const loading = ref(false)
const curStep = computed<Step | undefined>(() => getProp(stpDict.value, route.params.sid as string))
const selProp = ref<string>('')

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
  const stpMapper = mapperDict[step.stype]()
  setProp(stpMapper, 'colcCtnr.onClick', () => onSelElStart('colcCtnr'))
  setProp(stpMapper, 'colcItem.onClick', () => onSelElStart('colcItem'))
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
  if (selEle && selProp.value && curStep.value && curStep.value.stype === 'collect') {
    if (!route.params.sid) {
      return
    }
    const sid = route.params.sid as string
    setProp(stpDict.value, `${sid}.extra.${selProp.value}`, selEle)
    await stpAPI.update(pickOrIgnore(stpDict.value[sid], ['key', 'extra'], false))
    setProp(mapper.value, `${selProp.value}.ghost`, true)
    selProp.value = ''
  }
}
function onSelElStart(prop: string) {
  emitter.emit('sel-ele')
  swchBoolProp(mapper.value, `${prop}.ghost`)
  selProp.value = selProp.value ? '' : prop
}
async function onSelElClear(prop: string) {
  if (!route.params.sid) {
    return
  }
  const sid = route.params.sid as string
  getProp(stpDict.value, `${sid}.extra.${prop}`)?.reset()
  await stpAPI.update(pickOrIgnore(stpDict.value[sid], ['key', 'extra'], false))
  emitter.emit('clr-ele')
}
async function onElIdChange(iden: string) {
  if (!route.params.sid) {
    return
  }
  const sid = route.params.sid as string
  setProp(stpDict.value, `${sid}.extra.${selProp.value}.idType`, iden)
  await stpAPI.update(pickOrIgnore(stpDict.value[sid], ['key', 'extra'], false))
}
</script>
