<template>
  <a-layout class="w-full h-full overflow-hidden">
    <a-layout-header class="bg-white inline-flex items-center space-x-3">
      <a-button type="text" @click="() => router.back()">
        <template #icon><ArrowLeftOutlined /></template>
        返回流程设计
      </a-button>
      <a-input-group class="flex-1" size="large" compact>
        <a-input v-model:value="urlForm.url" size="large" style="width: calc(100% - 200px)">
          <template #prefix><RightOutlined /></template>
        </a-input>
        <a-button type="primary">跳转</a-button>
      </a-input-group>
    </a-layout-header>
    <a-layout-content class="flex">
      <PgEleSelect
        ref="pgElSelRef"
        :curURL="urlForm.url"
        v-model:selKeys="urlForm.selKeys"
        :sbar-wid="500"
      />
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
import Step from '@/types/step'
import stpAPI from '@/apis/step'

const route = useRoute()
const router = useRouter()
const urlForm = reactive({
  url: '',
  selKeys: []
})
const pgElSelRef = ref()
const task = ref<Task>()
const stpDict = ref<Record<string, Step>>({})

onMounted(refresh)

async function refresh() {
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
</script>
