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
      class="flex-1"
      :nodes="steps"
      :mapper="mapper"
      :emitter="emitter"
      :copy="Step.copy"
      :keygen-fun="onNewStepClick"
      @del:node="onDelStepSubmit"
      @update:nodes="onStepsUpdate"
      @click:node="onStepCardClick"
      @add:node="onNewStepSubmit"
    >
      <template #extToolBtns>
        <a-float-button tooltip="显示代码" @click="onShowCodesClick">
          <template #icon>
            <CodeOutlined />
          </template>
        </a-float-button>
      </template>
      <template #editNode_titleSFX="{ formState: step }: { formState: Step }">
        <a-button @click="() => onStepTitleAutoGen(step)">自动生成</a-button>
      </template>
      <template #editNode_extra.colcCtnrVW="{ formState: step }: { formState: Step }">
        {{ step.extra.container[step.extra.container.idType] }}
      </template>
      <template #editNode_extra.colcItemVW="{ formState: step }: { formState: Step }">
        {{ step.extra.item[step.extra.item.idType] }}
      </template>
    </FlowDsgn>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import FlowDsgn from '@lib/components/FlowDsgn.vue'
import { createVNode, onMounted, reactive, ref } from 'vue'
import Mapper from '@lib/types/mapper'
import Step, { onExecToStepClick, Stype, stypes } from '@/types/step'
import stpAPI from '@/apis/step'
import Task from '@/types/task'
import tskAPI from '@/apis/task'
import { TinyEmitter } from 'tiny-emitter'
import { getFlowRngKeys, newOne, pickOrIgnore } from '@lib/utils'
import { Cond } from '@lib/types'
import MetaObj, { metaMapper } from '@/types/metaObj'
import {
  PlusOutlined,
  MinusOutlined,
  ExclamationCircleOutlined,
  CodeOutlined,
  ClusterOutlined
} from '@ant-design/icons-vue'
import FormDialog from '@lib/components/FormDialog.vue'
import { Modal } from 'ant-design-vue'
import CodeEditor from '@lib/components/CodeEditor.vue'
import metaAPI from '@/apis/meta'
import _ from 'lodash'
import PgOper, { otypes } from '@lib/types/pgOper'
import { NdIntf } from '@lib/types/node'
import { v4 as uuid } from 'uuid'

const route = useRoute()
const router = useRouter()
const task = ref<Task>(new Task())
const steps = reactive<Step[]>([])
const stpDict = ref<Record<string, Step>>({})
const mapperDict = {
  goto: {
    chromePath: {
      type: 'Input',
      label: 'Chrome启动文件',
      placeholder: '不给出的话使用系统自带chrome浏览器'
    },
    url: {
      type: 'Input',
      label: '地址',
      rules: [{ required: true, message: '必须输入网站地址！' }]
    },
    newPage: {
      type: 'Switch',
      label: '新页面打开'
    }
  },
  collect: {
    container: {
      type: 'PageEleSel',
      label: '容器',
      onSelEleStart: () =>
        router.push(`/gui-crawler/task/${task.value.key}/step/${curStep.value?.key}/edit`)
    },
    item: {
      type: 'PageEleSel',
      label: '项',
      onSelEleStart: () =>
        router.push(`/gui-crawler/task/${task.value.key}/step/${curStep.value?.key}/edit`)
    },
    binMaps: {
      type: 'Table',
      label: '绑定表'
    },
    strategy: {
      type: 'Radio',
      label: '策略',
      options: [
        { label: '采集当页所有', value: 'all' },
        { label: '只采第一条', value: 'first' }
      ],
      style: 'button'
    }
  },
  end: {},
  opera: {
    opers: {
      type: 'EditList',
      label: '操作流程',
      mapper: new Mapper({
        element: {
          type: 'PageEleSel',
          label: '元素',
          onSelEleStart: () =>
            router.push(`/gui-crawler/task/${task.value.key}/step/${curStep.value?.key}/edit`)
        },
        otype: {
          type: 'Select',
          label: '类型',
          options: Object.entries(otypes).map(([value, { label }]) => ({ value, label })),
          onChange: (_form: any, to: keyof typeof otypes) => {
            emitter.emit('update:mprop', {
              'extra.items.value.display': ['input', 'select', 'pick'].includes(to),
              'extra.items.encrypt.display': to === 'input'
            })
          }
        },
        value: {
          type: 'Input',
          label: '值',
          display: false
        },
        encrypt: {
          type: 'Switch',
          label: '是否加密值',
          display: false
        },
        timeout: {
          type: 'Number',
          label: '延时',
          suffix: '毫秒'
        }
      }),
      lblProp: 'element.iden',
      inline: false,
      flatItem: false,
      subProp: 'otype',
      newFun: () => PgOper.copy({})
    }
  },
  unknown: {}
}
const avaStypes = ref<string[]>(
  Object.keys(stypes).filter(st => !['end', 'unknown', 'oper'].includes(st))
)
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
    options: Object.entries(stypes)
      .filter(([value]) => avaStypes.value.includes(value))
      .map(([value, { label }]) => ({ value, label })),
    disabled: {
      OR: [Cond.create('key', '!=', ''), Cond.create('previous.length', '==', 0)]
    },
    onChange: (editing: Step, stype: keyof typeof stypes) => {
      emitter.emit('update:mprop', { 'extra.items': new Mapper(mapperDict[stype]) })
      if (!editing.key) {
        emitter.emit('update:dprop', { extra: stype in stypes ? stypes[stype].copy({}) : {} })
      }
    }
  },
  extra: {
    type: 'FormGroup',
    label: '额外参数',
    prefix: true,
    canFold: false,
    display: [Cond.create('stype', '!=', 'end')]
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
  mapper: new Mapper(metaMapper)
})
const curStep = ref<Step>()

onMounted(refresh)

async function refresh() {
  task.value = await tskAPI.get(route.params.tid as string)
  steps.splice(0, steps.length, ...(await stpAPI.all()))
  stpDict.value = Object.fromEntries(steps.map(stp => [stp.key, stp]))
  emitter.emit('refresh')
}
async function onNewStepClick(step: Step) {
  return stpAPI.add(step).then(newStp => newStp.key)
}
async function onDelStepSubmit(step: Step, callback: Function) {
  if (step.stype === 'opera') {
    const keys = _.uniq(
      getFlowRngKeys(
        Object.fromEntries(steps.map(stp => [stp.key, stp])),
        step.key,
        step.relative as string
      )
    ).filter(key => key !== step.key)
    await Promise.all(
      keys.map(key => new Promise(resolve => emitter.emit('del:node', key, resolve)))
    )
  }
  await stpAPI.remove(step)
  callback()
}
async function onStepsUpdate(nstps: Step[], callback: Function) {
  await Promise.all(
    nstps.map(step => stpAPI.update(pickOrIgnore(step, ['key', 'previous', 'nexts'], false)))
  )
  await refresh()
  callback && callback()
}
async function onMetaSave(form: MetaObj, next: Function) {
  if (form.key) {
    await metaAPI(route.params.tid as string).update(form)
  } else {
    await metaAPI(route.params.tid as string).add(form)
  }
  next()
  task.value = await tskAPI.get(route.params.tid as string)
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
  const tskKey = route.params.tid as string
  const stpDict = Object.fromEntries(
    await stpAPI
      .all({ axiosConfig: { params: { fkTask: tskKey } } })
      .then(steps => steps.map(stp => [stp.key, stp]))
  )
  const cdDict = await tskAPI.getCode(tskKey)
  const codes = ['const ctx = {}']
  Object.entries(cdDict).map(([stpKey, strFun]) => {
    const step = stpDict[stpKey]
    codes.push(
      [
        '/***',
        ' * ' + step.title,
        step.desc ? ' * ' + step.desc : '',
        '**/',
        `await (${strFun})(ctx, ${JSON.stringify(step)}, ${JSON.stringify(task.value.fkMetaobjs)})`
      ]
        .filter(l => l)
        .join('\n')
    )
  })
  task.value.code = codes.join('\n\n')
}
function onStepCardClick(step: Step) {
  curStep.value = step
  if (!step.previous.length) {
    emitter.emit('update:dprop', { stype: 'goto' })
    step.stype = 'goto'
  }
  emitter.emit('update:mprop', { 'extra.items': new Mapper(mapperDict[step.stype as Stype]) })
  if (!step.key) {
    emitter.emit('update:dprop', {
      extra: step.stype && step.stype in stypes ? stypes[step.stype].copy({}) : {}
    })
  }
}
function onStepTitleAutoGen(step: Step) {
  let title = stypes[step.stype as Stype].title
  for (const [key, val] of Object.entries(step.extra || {})) {
    title = title.replace(`[${key}]`, (val as any).toString() || 'XXXX')
  }
  emitter.emit('update:dprop', { title })
}
async function onNewStepSubmit(newStp: Step, callback: Function) {
  switch(newStp.stype) {
    case 'collect':
      newStp.intfs.push(NdIntf.copy({ key: uuid(), label: '采集数据' }))
      break
  }
  callback()
}
</script>
