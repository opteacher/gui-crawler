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
      @update:el-id-type="onEleIdenChange"
    >
      <template #sideBottom>
        <FormGroup :disabled="loading" class="p-5" :mapper="mapper" :form="curStep?.extra">
          <template v-if="curStep?.stype === 'collect'" #colcCtnr>
            <a-button
              v-if="!curStep.extra.colcCtnr || !curStep.extra.colcCtnr.iden"
              class="w-full"
              :type="selProp === 'colcCtnr' ? 'primary' : 'default'"
              @click="() => onSelElClick('colcCtnr')"
            >
              选择元素
            </a-button>
            <a-input-group v-else compact class="flex">
              <a-button type="primary" ghost class="flex-1 truncate">
                {{ curStep.extra.colcCtnr.iden }}
              </a-button>
              <a-button type="primary" ghost danger @click="() => onBinEleClear('colcCtnr')">
                <template #icon><CloseOutlined /></template>
              </a-button>
            </a-input-group>
          </template>
          <template v-if="curStep?.stype === 'collect'" #colcItem>
            <a-button
              v-if="!curStep.extra.colcItem || !curStep.extra.colcItem.iden"
              class="w-full"
              :type="selProp === 'colcItem' ? 'primary' : 'default'"
              @click="() => onSelElClick('colcItem')"
            >
              选择元素
            </a-button>
            <a-input-group v-else compact class="flex">
              <a-button type="primary" ghost class="flex-1 truncate">
                {{ curStep.extra.colcItem.iden }}
              </a-button>
              <a-button type="primary" ghost danger @click="() => onBinEleClear('colcItem')">
                <template #icon><CloseOutlined /></template>
              </a-button>
            </a-input-group>
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
import { getProp, setProp, swchBoolProp } from '@lib/utils'
import PageEle from '@lib/types/pageEle'
import { CloseOutlined } from '@ant-design/icons-vue'

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
  setProp(stpMapper, 'colcCtnr.onClick', () => onSelElClick('colcCtnr'))
  setProp(stpMapper, 'colcItem.onClick', () => onSelElClick('colcItem'))
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
function onEleSelect(selEle?: PageEle) {
  if (selEle && selProp.value && curStep.value && curStep.value.stype === 'collect') {
    setProp(stpDict.value, `${route.params.sid}.extra.${selProp.value}`, selEle)
    setProp(mapper.value, `${selProp.value}.inner`, selEle.iden)
    setProp(mapper.value, `${selProp.value}.ghost`, true)
    selProp.value = ''
  }
}
function onEleIdenChange(idType: 'xpath' | 'idCls' | 'tagName') {
  if (selProp.value && curStep.value && curStep.value.stype === 'collect') {
    setProp(stpDict.value, `${route.params.sid}.extra.${selProp}.idType`, idType)
    setProp(mapper.value, `${selProp.value}.inner`, getProp(curStep.value, `extra.${selProp}`))
  }
}
function onSelElClick(prop: string) {
  emitter.emit('sel-ele')
  swchBoolProp(mapper.value, `${prop}.ghost`)
  selProp.value = selProp.value ? '' : prop
}
function onBinEleClear(prop: string) {
  getProp(stpDict.value, `${route.params.sid}.extra.${prop}`)?.reset()
  emitter.emit('clr-ele')
}
</script>
