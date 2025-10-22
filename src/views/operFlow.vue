<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <a-page-header :title="task.name" :sub-title="task.desc" @back="() => router.back()">
      <template #extra>
        <a-input-group v-for="meta in task.fkMetaobjs as MetaObj[]" compact class="flex">
          <a-button class="flex-1" @click="() => onMetaEdtClick(meta)">
            {{ meta.name }}
          </a-button>
          <a-button @click="() => onMetaDelClick(meta)">
            <template #icon><MinusOutlined /></template>
          </a-button>
        </a-input-group>
        <a-button type="primary" @click="onMetaEdtClick">
          <template #icon><PlusOutlined /></template>
          添加元对象
        </a-button>
      </template>
      <FormDialog
        title="添加元对象"
        width="40vw"
        :mapper="metaState.mapper"
        :emitter="metaState.emitter"
        :new-fun="() => newOne(MetaObj)"
        @submit="onMetaSave"
      />
    </a-page-header>
    <template v-if="task.code">
      <CodeEditor class="flex-1" :disabled="true" :value="task.code" />
      <a-float-button
        tooltip="显示流程"
        shape="circle"
        type="primary"
        :style="{ right: '24px' }"
        @click="() => (task.code = '')"
      >
        <template #icon>
          <ClusterOutlined />
        </template>
      </a-float-button>
    </template>
    <FlowDsgn
      v-else
      :nodes="steps"
      :mapper="mapper"
      :emitter="emitter"
      :copy="Step.copy"
      :keygen-fun="onNewStepClick"
      @del:node="onDelStepSubmit"
      @update:nodes="onStepsUpdate"
      @click:node="onStepCardClick"
    >
      <template #extToolBtns>
        <a-float-button tooltip="显示代码" @click="onShowCodesClick">
          <template #icon>
            <CodeOutlined />
          </template>
        </a-float-button>
      </template>
      <template #nodeCard_moreMuItms="{ node }: any">
        <a-menu-item key="preview" @click="() => onExecToStepClick(node)">
          <template #icon><PlayCircleOutlined /></template>
          执行到该步骤
        </a-menu-item>
      </template>
      <template #editNode_titleSFX="{ formState: step }: { formState: Step }">
        <a-button @click="() => onStepTitleAutoGen(step)">自动生成</a-button>
      </template>
      <template #editNode_extra.colcCtnrVW="{ formState: step }: { formState: Step }">
        {{ step.extra.colcCtnr[step.extra.colcCtnr.idType] }}
      </template>
      <template #editNode_extra.colcItemVW="{ formState: step }: { formState: Step }">
        {{ step.extra.colcItem[step.extra.colcItem.idType] }}
      </template>
    </FlowDsgn>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import FlowDsgn from '@lib/components/FlowDsgn.vue'
import { createVNode, onMounted, reactive, ref } from 'vue'
import Mapper from '@lib/types/mapper'
import Step, { CollectExtra, mapperDict, Stype, stypes } from '@/types/step'
import stpAPI from '@/apis/step'
import Task from '@/types/task'
import tskAPI from '@/apis/task'
import { TinyEmitter } from 'tiny-emitter'
import { newOne, pickOrIgnore } from '@lib/utils'
import { Cond, typeOpns } from '@lib/types'
import MetaObj, { Mprop } from '@/types/metaObj'
import {
  PlusOutlined,
  MinusOutlined,
  ExclamationCircleOutlined,
  CodeOutlined,
  ClusterOutlined,
  PlayCircleOutlined
} from '@ant-design/icons-vue'
import FormDialog from '@lib/components/FormDialog.vue'
import { Modal, notification } from 'ant-design-vue'
import CodeEditor from '@lib/components/CodeEditor.vue'
import metaAPI from '@/apis/meta'
import _ from 'lodash'
import { v4 as uuid } from 'uuid'

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
    options: Object.entries(stypes).map(([value, { label }]) => ({ value, label })),
    disabled: {
      OR: [Cond.create('key', '!=', ''), Cond.create('previous.length', '==', 0)]
    },
    onChange: (editing: Step, stype: keyof typeof stypes) => {
      emitter.emit('update:mprop', { 'extra.items': mapperDict[stype]() })
      emitter.emit('update:dprop', { extra: stypes[stype].copy({}) })
      console.log(editing)
    }
  },
  extra: {
    type: 'FormGroup',
    label: '额外参数',
    prefix: true,
    canFold: false
  },
  preview: {
    type: 'Button',
    display: [Cond.create('key', '!=', '')],
    offset: 4,
    inner: '执行到该步骤',
    onClick: onExecToStepClick
  }
})
const emitter = new TinyEmitter()
const metaState = reactive({
  emitter: new TinyEmitter(),
  mapper: new Mapper({
    name: {
      type: 'Input',
      label: '名称',
      rules: [{ required: true, message: '必须输入名称！' }],
      onBlur: (editing: MetaObj, name: string) => {
        editing.name = _.capitalize(name)
      }
    },
    label: {
      type: 'Input',
      label: '中文名'
    },
    desc: {
      type: 'Textarea',
      label: '描述'
    },
    propers: {
      type: 'EditList',
      label: '字段',
      rules: [{ required: true, message: '必须填入至少一个字段！', type: 'array' }],
      lblProp: 'name',
      inline: false,
      flatItem: false,
      subProp: 'label',
      mapper: new Mapper({
        name: {
          type: 'Input',
          label: '字段名',
          rules: [{ required: true, message: '必须输入字段名！' }]
        },
        label: {
          type: 'Input',
          label: '中文名'
        },
        ptype: {
          type: 'Select',
          label: '类型',
          options: typeOpns,
          rules: [{ required: true, message: '必须选择类型！', trigger: 'change' }]
        }
      }),
      newFun: Mprop.copy,
      onAddSubmit: (newProp: Mprop) => (newProp.key = uuid())
    }
  })
})

onMounted(refresh)

async function refresh() {
  task.value = await tskAPI.get(route.params.tid as string)
  steps.splice(0, steps.length, ...(await stpAPI.all()))
  emitter.emit('refresh')
}
async function onNewStepClick(step: Step) {
  return stpAPI.add(step).then(newStp => newStp.key)
}
async function onDelStepSubmit(step: Step, callback: Function) {
  await stpAPI.remove(step)
  callback()
}
async function onStepsUpdate(nstps: Step[]) {
  await Promise.all(
    nstps.map(step => stpAPI.update(pickOrIgnore(step, ['key', 'previous', 'nexts'], false)))
  )
  await refresh()
}
async function onMetaSave(form: MetaObj, next: Function) {
  const meta = await metaAPI(route.params.tid as string).add(form)
  task.value.fkMetaobjs.push(meta)
  next()
}
function onMetaEdtClick(meta?: MetaObj) {
  metaState.emitter.emit('update:visible', { show: true, object: meta })
}
function onMetaDelClick(meta: MetaObj) {
  Modal.confirm({
    title: `确定删除该元对象【${meta.name}】`,
    icon: createVNode(ExclamationCircleOutlined),
    async onOk() {
      const metas = task.value.fkMetaobjs as MetaObj[]
      const [delMeta] = metas.splice(
        metas.findIndex(m => m.key === meta.key),
        1
      )
      await metaAPI(route.params.tid as string).remove(delMeta)
    }
  })
}
async function onShowCodesClick() {
  task.value.code = await tskAPI.getCode(route.params.tid as string)
}
function onExecToStepClick(step: Step) {
  const tskKey = route.params.tid as string
  const stpKey = step.key || step.previous[0]
  if (!stpKey) {
    notification.error({ message: '无法跳转到该步骤！' })
    return
  }
  router.push(`/gui-crawler/task/${tskKey}/step/${stpKey}/edit`)
}
function onStepCardClick(step: Step) {
  if (!step.previous.length) {
    emitter.emit('update:dprop', { stype: 'goto' })
    step.stype = 'goto'
  }
  emitter.emit('update:mprop', { 'extra.items': mapperDict[step.stype as Stype]() })
  switch (step.stype) {
    case 'collect':
      const extra = step.extra as CollectExtra
      emitter.emit('update:mprop', {
        'extra.items.colcCtnr.onClick': () =>
          router.push(`/gui-crawler/task/${route.params.tid}/step/${step.key}/edit`),
        'extra.items.colcItem.onClick': () =>
          router.push(`/gui-crawler/task/${route.params.tid}/step/${step.key}/edit`)
      })
      if (extra.colcCtnr.iden) {
        emitter.emit('update:mprop', {
          'extra.items.colcCtnr.inner': extra.colcCtnr.iden
        })
      }
      if (extra.colcItem.iden) {
        emitter.emit('update:mprop', {
          'extra.items.colcItem.inner': extra.colcItem.iden
        })
      }
  }
}
function onStepTitleAutoGen(step: Step) {
  let title = stypes[step.stype as Stype].title
  for (const [key, val] of Object.entries(step.extra)) {
    title = title.replace(`@${key}$`, (val as any).toString() || 'XXXX')
  }
  emitter.emit('update:dprop', { title })
}
</script>
