<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <a-page-header :title="task.name" :sub-title="task.desc" @back="() => router.back()">
      <template #extra>
        <a-input-group v-for="meta in task.metas" compact class="flex">
          <a-button class="flex-1" @click="onMetaEdtClick">
            {{ meta.name }}
          </a-button>
          <a-button @click="() => onMetaDelClick(meta)">
            <template #icon><MinusOutlined /></template>
          </a-button>
        </a-input-group>
        <a-button type="dashed" @click="onMetaEdtClick">
          <template #icon><PlusOutlined /></template>
          添加元对象
        </a-button>
      </template>
      <FormDialog
        title="添加元对象"
        :mapper="metaState.mapper"
        :emitter="metaState.emitter"
        :new-fun="() => newOne(Meta)"
        @submit="onMetaSave"
      />
    </a-page-header>
    <FlowDsgn
      :nodes="steps"
      :mapper="mapper"
      :emitter="emitter"
      :copy="Step.copy"
      :keygen-fun="onNewStepClick"
      @del:node="onDelStepSubmit"
      @update:nodes="onStepsUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import FlowDsgn from '@lib/components/FlowDsgn.vue'
import { createVNode, onMounted, reactive, ref } from 'vue'
import Mapper from '@lib/types/mapper'
import Step, { stypes } from '@/types/step'
import stpAPI from '@/apis/step'
import Task from '@/types/task'
import tskAPI from '@/apis/task'
import { TinyEmitter } from 'tiny-emitter'
import { newOne, pickOrIgnore } from '@lib/utils'
import { Cond, typeOpns } from '@lib/types'
import Column from '@lib/types/column'
import Meta, { Mprop } from '@/types/meta'
import { PlusOutlined, MinusOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import FormDialog from '@lib/components/FormDialog.vue'
import { v4 as uuid } from 'uuid'
import { Modal } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()
const task = ref<Task>(new Task())
const steps = reactive<Step[]>([])
const mapper = new Mapper({
  title: {
    type: 'Input',
    label: '标题',
    rules: [{ required: true, message: '必须输入标题！' }]
  },
  desc: {
    type: 'Textarea',
    label: '描述'
  },
  stype: {
    type: 'Select',
    label: '类型',
    rules: [{ required: true, message: '必须选择类型！', trigger: 'change' }],
    options: Object.entries(stypes).map(([value, { label }]) => ({ value, label }))
  },
  extra: {
    type: 'FormGroup',
    label: '额外参数',
    canFold: false,
    items: new Mapper({
      url: {
        type: 'Input',
        label: '地址',
        rules: [{ required: true, message: '必须输入网站地址！' }],
        display: [Cond.create('stype', '=', 'goto')]
      },
      newPage: {
        type: 'Switch',
        label: '新页面打开',
        display: [Cond.create('stype', '=', 'goto')]
      },
      colcTable: {
        type: 'Table',
        label: '采集表',
        display: [Cond.create('stype', '=', 'collect')],
        mapper: new Mapper({
          key: {
            type: 'Input',
            label: '字段名',
            rules: [{ required: true, message: '必须输入字段名！' }]
          },
          name: {
            type: 'Input',
            label: '中文名',
            rules: [{ required: true, message: '必须输入中文名！' }]
          },
          ptype: {
            type: 'Select',
            label: '类型',
            options: typeOpns
          }
        }),
        columns: [
          new Column('字段名', 'key'),
          new Column('中文名', 'name'),
          new Column('类型', 'ptype')
        ],
        newFun: () => newOne(Mprop)
      }
    })
  }
})
const emitter = new TinyEmitter()
const metaState = reactive({
  emitter: new TinyEmitter(),
  mapper: new Mapper({
    name: {
      type: 'Input',
      label: '名称',
      rules: [{ required: true, message: '必须输入名称！' }]
    }
  })
})

onMounted(refresh)

async function refresh() {
  task.value = await tskAPI.get(route.params.tid as string)
  steps.splice(0, steps.length, ...(await stpAPI.all()))
  emitter.emit('refresh')
}
async function onNewStepClick(step: any) {
  return stpAPI.add(step).then(newStp => newStp.key)
}
function onDelStepSubmit(step: any) {
  return stpAPI.remove(step)
}
async function onStepsUpdate(nstps: Step[]) {
  await Promise.all(
    nstps.map(step => stpAPI.update(pickOrIgnore(step, ['key', 'previous', 'nexts'], false)))
  )
  await refresh()
}
function onMetaSave(form: Meta, next: Function) {
  task.value.metas.push(Meta.copy({ ...form, key: uuid() }))
  next()
}
function onMetaEdtClick(meta?: Meta) {
  metaState.emitter.emit('update:visible', { show: true, object: meta })
}
function onMetaDelClick(meta: Meta) {
  Modal.confirm({
    title: `确定删除该元对象【${meta.name}】`,
    icon: createVNode(ExclamationCircleOutlined),
    onOk() {
      task.value.metas.splice(
        task.value.metas.findIndex(m => m.key === meta.key),
        1
      )
    }
  })
}
</script>
