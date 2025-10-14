<template>
  <a-layout class="w-full h-full overflow-hidden">
    <a-layout-header class="bg-white inline-flex items-center space-x-3">
      <a-button type="text" @click="() => router.back()">
        <template #icon><ArrowLeftOutlined /></template>
        返回流程设计
      </a-button>
      <a-input-group class="flex-1" size="large" compact>
        <a-input
          :disabled="loading"
          v-model:value="urlForm.url"
          size="large"
          style="width: calc(100% - 200px)"
        >
          <template #prefix><RightOutlined /></template>
        </a-input>
        <a-button :loading="loading" type="primary">跳转</a-button>
      </a-input-group>
    </a-layout-header>
    <a-layout-content class="flex">
      <PgEleSelect
        ref="pgElSelRef"
        :curURL="urlForm.url"
        v-model:selKeys="urlForm.selKeys"
        v-model:loading="loading"
        :sbar-wid="500"
        :emitter="emitter"
        @update:sel-keys="onEleSelect"
      >
        <template #sideBottom>
          <FormGroup :disabled="loading" class="p-5" :mapper="mapper" :form="form">
            <template #colcItem>
              <EleSelWrap pname="colcItem" :form="form.colcItem" />
            </template>
          </FormGroup>
        </template>
      </PgEleSelect>
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RightOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'
import PgEleSelect from '@lib/components/PgEleSelect.vue'
import { useRoute, useRouter } from 'vue-router'
import Task from '@/types/task'
import tskAPI from '@/apis/task'
import Step, { CollectExtra } from '@/types/step'
import stpAPI from '@/apis/step'
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper, { ButtonMapper } from '@lib/types/mapper'
import EleSelWrap from '@/components/eleSelWrap.vue'
import { TinyEmitter } from 'tiny-emitter'
import { setProp } from '@lib/utils'

const route = useRoute()
const router = useRouter()
const urlForm = reactive({
  url: '',
  selKeys: []
})
const pgElSelRef = ref()
const task = ref<Task>()
const stpDict = ref<Record<string, Step>>({})
const mapper = reactive(
  new Mapper({
    colcCtnr: {
      type: 'Buttons',
      label: '容器',
      buttons: [
        {
          ...new ButtonMapper(),
          inner: '选择元素',
          onClick: () => {
            emitter.emit('sel-ele')
            setProp(mapper, 'colcCtnr.buttons[0].ghost', false)
          }
        },
        {
          ...new ButtonMapper(),
          icon: 'MinusCircleOutlined',
          danger: true,
          fullWid: false,
          onClick: () => {
            form.colcCtnr.reset()
          }
        }
      ]
    },
    colcItem: {
      type: 'Unknown',
      label: '项'
    },
    colcEles: {
      type: 'Table',
      label: '映射'
    }
  })
)
const form = reactive(new CollectExtra())
const emitter = new TinyEmitter()
const loading = ref(false)

onMounted(refresh)

async function refresh() {
  loading.value = true
  const tskKey = route.params.tid as string
  task.value = await tskAPI.get(tskKey)
  const steps = await stpAPI.all({ axiosConfig: { params: { fkTask: tskKey } } })
  stpDict.value = Object.fromEntries(steps.map(s => [s.key, s] as const))
  const stpKey = route.params.sid as string
  if (steps.length) {
    let step = steps[0]
    do {
      switch (step.stype) {
        case 'goto':
          urlForm.url = step?.extra.url
          break
        case 'collect':
          break
      }
      if (!step.nexts.length) {
        break
      }
      step = stpDict.value[step.nexts[0]]
    } while (step.key !== stpKey)
  }
}
function onEleSelect() {
  setProp(mapper, 'colcCtnr.buttons[0].ghost', true)
}
</script>
