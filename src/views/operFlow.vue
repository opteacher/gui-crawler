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
    </FlowDsgn>
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
      OR: [Cond.create('key', '!=', ''), Cond.create('previous.length', '=', 0)]
    }
  },
  extra: {
    type: 'FormGroup',
    label: '额外参数',
    prefix: true,
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
      colcCtnr: {
        type: 'Button',
        inner: '选择元素',
        label: '采集容器',
        placeholder: '将跳转到页面选择元素',
        display: [Cond.create('stype', '=', 'collect')],
        onClick: onExecToStepClick
      },
      colcItem: {
        type: 'Button',
        inner: '选择元素',
        label: '采集项',
        placeholder: '将跳转到页面选择元素',
        display: [Cond.create('stype', '=', 'collect')],
        onClick: onExecToStepClick
      },
      colcEles: {
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
            options: typeOpns,
            rules: [{ required: true, message: '必须选择字段类型！', trigger: 'change' }]
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
  },
  preview: {
    type: 'Button',
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
      rules: [{ required: true, message: '必须输入名称！' }]
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
      subProp: 'desc',
      mapper: new Mapper({
        name: {
          type: 'Input',
          label: '字段名（英）',
          rules: [{ required: true, message: '必须输入字段名！' }]
        },
        desc: {
          type: 'Input',
          label: '说明（中）'
        },
        ptype: {
          type: 'Select',
          label: '类型',
          options: typeOpns,
          rules: [{ required: true, message: '必须选择类型！', trigger: 'change' }]
        }
      }),
      newFun: Mprop.copy
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
</script>
