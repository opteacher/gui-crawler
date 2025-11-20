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
      @node-del="onDelStepSubmit"
      @update:nodes="onStepsUpdate"
      @node-click="onStepCardClick"
      @node-add="onNewStepSubmit"
      @node-intf-click="onStepIoClick"
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
    <a-drawer
      :open="stepIntf.ins.key !== ''"
      class="custom-class"
      root-class-name="root-class-name"
      :root-style="{ color: 'blue' }"
      style="color: red"
      :placement="stepIntf.ins.side"
      @close="onStepIoDismiss"
    >
      <template #title>
        {{ curStep?.title }}
        <a-typography-text type="secondary">{{ stepIntf.ins?.label }}</a-typography-text>
      </template>
      <FormGroup :form="stepIntf.ins" :mapper="stepIntf.mapper" />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import FlowDsgn from '@lib/components/FlowDsgn.vue'
import { createVNode, onMounted, reactive, ref } from 'vue'
import Mapper from '@lib/types/mapper'
import Step, { getAvaVars, onExecToStepClick } from '@/types/step'
import { OperaExtra, stypes, ControlExtra, ctrlTypes, Stype, ReqInfo } from '@/types/stpExtra'
import stpAPI from '@/apis/step'
import Task from '@/types/task'
import tskAPI from '@/apis/task'
import { TinyEmitter } from 'tiny-emitter'
import { getFlowRngKeys, newOne, pickOrIgnore, setProp } from '@lib/utils'
import { Cond, methods } from '@lib/types'
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
import FormGroup from '@lib/components/FormGroup.vue'
import Column from '@lib/types/column'
import { cmpOpns, relatives } from '@lib/types'

const route = useRoute()
const router = useRouter()
const task = ref<Task>(new Task())
const steps = reactive<Step[]>([])
const curStep = ref<Step>()
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
      label: '采集容器',
      onSelEleStart: () =>
        router.push(`/gui-crawler/task/${task.value.key}/step/${curStep.value?.key}/edit`)
    },
    item: {
      type: 'PageEleSel',
      label: '采集项',
      onSelEleStart: () =>
        router.push(`/gui-crawler/task/${task.value.key}/step/${curStep.value?.key}/edit`)
    },
    binMaps: {
      type: 'Table',
      label: '绑定表'
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
  unknown: {},
  control: {
    ctype: {
      type: 'Select',
      label: '控制类型',
      rules: [{ required: true, message: '必须先选择类型！', trigger: 'change' }],
      options: Object.entries(ctrlTypes).map(([value, { label }]) => ({ value, label })),
      disabled: [Cond.create('key', '!=', '')]
    },
    param: {
      type: 'SelOrIpt',
      label: '控制参数',
      placeholder: '可以设为True，则以下条件节点独立判断',
      options: [{ value: 'true', label: '真' }]
    }
  },
  condition: {
    conds: {
      type: 'Table',
      label: '条件集',
      desc: '如果父控制步骤设置了参数，则这里只需要设置值即可，判断依据是【控制参数 == 值】',
      value: curStep.value?.extra.conds,
      columns: [
        new Column('关系', 'relative', { width: 100 }),
        new Column('键', 'prop', { width: 100 }),
        new Column('比较', 'compare', { width: 100 }),
        new Column('值', 'value', { width: 100 })
      ],
      mapper: new Mapper({
        relative: {
          type: 'Select',
          label: '关系',
          options: Object.entries(relatives).map(([value, label]) => ({ value, label }))
        },
        prop: {
          type: 'SelOrIpt',
          label: '键',
          rules: [{ required: true, message: '必须输入或选择键！', trigger: 'change' }]
        },
        compare: {
          type: 'Select',
          label: '比较',
          rules: [{ required: true, message: '必须选择比较符！', trigger: 'change' }],
          options: cmpOpns
        },
        value: {
          type: 'SelOrIpt',
          label: '值',
          rules: [{ required: true, message: '必须输入值！' }]
        }
      }),
      newFun: () => ({ relative: 'AND', prop: undefined, compare: '==', value: undefined }),
      genIdFun: () => uuid(),
      onChange: (step: Step) => stpAPI.update(pickOrIgnore(step, ['key', 'extra'], false))
    }
  },
  processing: {
    storeToDB: {
      type: 'Switch',
      label: '存入数据库'
    },
    pushPoints: {
      type: 'EditList',
      label: '推送接口',
      inline: false,
      flatItem: false,
      mapper: new Mapper({
        url: {
          type: 'Textarea',
          label: 'URL或Host',
          rules: [{ required: true, message: '必须填入URL或Host！' }]
        },
        port: {
          type: 'Number',
          label: '端口'
        },
        method: {
          type: 'Select',
          label: '请求方式',
          options: methods.map(m => ({ value: m, label: m }))
        },
        body: {
          type: 'JsonEditor',
          label: '请求体',
          desc: '默认则直接使用采集的原数据'
        },
        prop: {
          type: 'Input',
          label: '字段名',
          placeholder: '规则跟getProp和setProp一致'
        }
      }),
      newFun: () => newOne(ReqInfo)
    },
    minioCli: {
      type: 'FormGroup',
      label: 'MinIO配置',
      canFold: false,
      prefix: true,
      items: new Mapper({
        endPoint: {
          type: 'Input',
          label: '端URL'
        },
        port: {
          type: 'Number',
          label: '端口'
        },
        useSSL: {
          type: 'Switch',
          label: '是否SSL'
        },
        accessKey: {
          type: 'Input',
          label: '对接KEY'
        },
        secretKey: {
          type: 'Password',
          label: '密钥KEY'
        }
      })
    }
  }
}
const avaStypes = ref<string[]>(
  Object.keys(stypes).filter(st => !['end', 'unknown', 'condition'].includes(st))
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
    onChange: (editing: Step, stype: keyof typeof stypes) =>
      onStypeChange(setProp(editing, 'stype', stype))
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
const stepIntf = reactive({
  ins: new NdIntf(),
  mapper: new Mapper({
    pvwBtn: {
      type: 'Button',
      inner: '预览',
      offset: 4,
      onClick: () => {
        console.log('TTTTTTTTTTT')
      }
    }
  })
})

onMounted(refresh)

async function refresh() {
  task.value = await tskAPI.get(route.params.tid as string)
  steps.splice(0, steps.length, ...(await stpAPI.all()))
  for (const step of steps) {
    switch (step.stype) {
      case 'opera':
        step.intfs = (step.extra as OperaExtra).opers
          .filter(oper => oper.otype === 'pick')
          .map(oper =>
            NdIntf.copy({
              key: uuid(),
              side: 'right',
              niType: 'output',
              label: oper.element.iden,
              desc: oper.value
            })
          )
        break
    }
  }
  stpDict.value = Object.fromEntries(steps.map(stp => [stp.key, stp]))
  emitter.emit('refresh')
}
async function onNewStepClick(step: Step) {
  return stpAPI.add(step).then(newStp => newStp.key)
}
async function onDelStepSubmit(step: Step, callback: Function) {
  switch (step.stype) {
    case 'control':
      {
        const keys = _.uniq(
          getFlowRngKeys(
            Object.fromEntries(steps.map(stp => [stp.key, stp])),
            step.key,
            step.relative as string
          )
        ).filter(key => key !== step.key)
        for (const key of keys) {
          await new Promise(resolve => emitter.emit('del:node', key, resolve))
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      break
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
  onStypeChange(step)
}
function onStepTitleAutoGen(step: Step) {
  let title = stypes[step.stype as Stype].title
  for (const [key, val] of Object.entries(step.extra || {})) {
    title = title.replace(`[${key}]`, (val as any).toString() || 'XXXX')
  }
  emitter.emit('update:dprop', { title })
}
async function onNewStepSubmit(newStp: Step, callback: Function) {
  switch (newStp.stype) {
    case 'collect':
      newStp.intfs.push(NdIntf.copy({ key: uuid(), label: '采集数据' }))
      await stpAPI.update(pickOrIgnore(newStp, ['key', 'intfs'], false))
      break
    case 'control':
      {
        newStp.intfs.push(
          NdIntf.copy({
            key: uuid(),
            label: '控制参数',
            desc: '对于条件步骤，参数为条件对比变量；对于循环步骤，参数为递归数组',
            niType: 'input',
            side: 'left'
          })
        )
        await stpAPI.update(pickOrIgnore(newStp, ['key', 'intfs'], false))
        const endStep = (await new Promise(resolve =>
          emitter.emit(
            'add:node',
            {
              title: stypes.end.title,
              stype: 'end',
              delable: false,
              relative: newStp.key,
              previous: [newStp.key],
              nexts: newStp.nexts
            },
            resolve
          )
        )) as Step
        if ((newStp.extra as ControlExtra).ctype === 'switch') {
          await new Promise(resolve =>
            emitter.emit(
              'add:node',
              {
                title: stypes.condition.title,
                stype: 'condition',
                extra: stypes.condition.copy({}),
                previous: [newStp.key],
                nexts: [endStep.key]
              },
              resolve
            )
          )
        }
      }
      break
  }
  callback()
}
function onStepIoClick(step: Step, io: NdIntf) {
  NdIntf.copy(io, stepIntf.ins, true)
  curStep.value = step
}
function onStepIoDismiss() {
  stepIntf.ins.key = ''
  setTimeout(() => {
    stepIntf.ins.reset()
    curStep.value = undefined
  }, 500)
}
function onStypeChange(step: Step) {
  emitter.emit('update:mprop', {
    'extra.items': new Mapper(step.stype ? mapperDict[step.stype] : {})
  })
  switch (step.stype) {
    case 'control':
      emitter.emit('update:mprop', {
        'extra.items.param.options': getAvaVars(step, stpDict.value).map(intf => ({
          label: intf.label,
          value: intf.key
        }))
      })
      break
  }
  if (!step.key) {
    emitter.emit('update:dprop', {
      extra: step.stype ? stypes[step.stype].copy({}) : {}
    })
  }
}
</script>
