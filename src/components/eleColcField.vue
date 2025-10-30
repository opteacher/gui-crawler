<template>
  <FormGroup v-if="editing" :mapper="mapper" :form="editing" />
  <a-button v-else class="w-full" type="primary" ghost @click="() => (editing = new BinMap())">
    添加采集元素
  </a-button>
  <a-descriptions
    class="mt-2"
    bordered
    size="small"
    :column="1"
    :labelStyle="{ 'align-items': 'center' }"
    :contentStyle="{ 'align-items': 'center' }"
  >
    <a-descriptions-item v-for="binMap in stepExtra.binMaps">
      <template #label>
        <a-space>
          <div class="flex flex-col">
            <a-tooltip v-if="binMap.required">
              <template #title>必须，为空则跳过</template>
              <a class="text-[#ff4d4f] font-bold text-xl">*</a>
            </a-tooltip>
            <a-tooltip v-if="binMap.unqProp">
              <template #title>唯一字段，重复则跳过</template>
              <a class="text-[#ff4d4f] font-bold text-l">1</a>
            </a-tooltip>
          </div>
          <a @click="() => onEleIdClick(binMap)">
            <pre class="mb-0">{{ getEleIdenLabel(binMap) }}</pre>
          </a>
          <a-tag class="me-0" :color="ctypes[binMap.ctype].color">
            <a-tooltip
              trigger="click"
              @openChange="(show: boolean) => show ? genBinEleText(binMap) : undefined"
            >
              <template #title>{{ eleText }}</template>
              <a :style="{ color: ctypes[binMap.ctype].color }">{{ binMap.ctype }}</a>
            </a-tooltip>
          </a-tag>
        </a-space>
      </template>
      <a-space>
        <a-button type="text" size="small" @click="() => onMetaObjClick(binMap)">
          {{ getMetaPropLabel(binMap) }}
        </a-button>
        <a-popconfirm
          title="确定解绑该页面元素和元对象的映射？"
          @confirm="() => onUnbinMapSubmit(binMap)"
        >
          <a-button type="text" size="small" danger>
            <template #icon><MinusCircleOutlined /></template>
          </a-button>
        </a-popconfirm>
      </a-space>
    </a-descriptions-item>
  </a-descriptions>
  <FormDialog title="元对象" width="40vw" :mapper="new Mapper(mapper)" :emitter="metaEmitter">
    <template #preOpersVW="{ formState }: { formState: BinMap }">
      <ul class="list-none ps-0 mb-0">
        <li v-for="oper in formState.preOpers">
          {{ oper.element.iden }}
          <a-tag class="ms-2" :color="otypes[oper.otype].color">{{ oper.otype }}</a-tag>
        </li>
      </ul>
    </template>
  </FormDialog>
</template>

<script setup lang="ts">
import FormGroup from '@lib/components/FormGroup.vue'
import FormDialog from '@lib/components/FormDialog.vue'
import Mapper, { ButtonMapper } from '@lib/types/mapper'
import { computed, PropType, reactive, ref, toRef } from 'vue'
import BinMap, { ctypes } from '../types/binMap'
import { TinyEmitter } from 'tiny-emitter'
import PageEle from '@lib/types/pageEle'
import MetaObj from '@/types/metaObj'
import { setProp, getProp, pickOrIgnore, getEleByJS } from '@lib/utils'
import { CollectExtra } from '@/types/step'
import { MinusCircleOutlined } from '@ant-design/icons-vue'
import { v4 as uuid } from 'uuid'
import PgOper, { otypes } from '@lib/types/pgOper'
import { Cond } from '@lib/types'
import TurndownService from 'turndown'

const props = defineProps({
  emitter: { type: TinyEmitter, required: true },
  metaObjs: { type: Array as PropType<MetaObj[]>, default: [] },
  stepExtra: { type: Object as PropType<CollectExtra>, required: true },
  webview: { type: Object as PropType<Electron.WebviewTag>, default: null }
})
const emit = defineEmits(['eleMetaBind', 'eleMetaUnbind'])
const tdSvc = new TurndownService()
const stepExtra = toRef(props.stepExtra)
const editing = ref<BinMap | null>(null)
const mapper = reactive(
  new Mapper({
    preOpers: {
      type: 'EditList',
      label: '前置操作',
      inline: false,
      lblProp: 'element.iden',
      flatItem: false,
      subProp: 'otype',
      mapper: new Mapper({
        element: {
          type: 'PageEleSel',
          label: '页面元素',
          rules: [
            {
              required: true,
              message: '必须选择待提取的页面元素！',
              validator: (rule: any, value: PageEle, callback: (errMsg: string) => void) => {
                callback(value.xpath ? undefined : rule.message)
              }
            }
          ],
          emitter: props.emitter,
          seledStop: false
        },
        otype: {
          type: 'Select',
          label: '操作类型',
          options: Object.entries(otypes).map(([value, { label }]) => ({ label, value }))
        },
        value: {
          type: 'Input',
          label: '输入值',
          display: {
            OR: [Cond.create('otype', '==', 'input'), Cond.create('otype', '==', 'select')]
          }
        },
        encrypt: {
          type: 'Switch',
          label: '加密',
          chkLabels: ['不加密', '加密'],
          display: [Cond.create('otype', '==', 'input')]
        }
      }),
      newFun: PgOper.copy,
      onChange: (binMap: BinMap, opers: PgOper[]) => {
        binMap.preOpers = opers
      }
    },
    execOpers: {
      type: 'Button',
      inner: '执行操作',
      offset: 4,
      display: (binMap: BinMap) => binMap.preOpers.length,
      onClick: (binMap: BinMap) => onPreOpersExec(binMap)
    },
    element: {
      type: 'PageEleSel',
      label: '页面元素',
      rules: [
        {
          required: true,
          message: '必须选择待提取的页面元素！',
          validator: (rule: any, value: PageEle, callback: (errMsg: string) => void) => {
            callback(value.xpath ? undefined : rule.message)
          }
        }
      ],
      emitter: props.emitter,
      seledStop: false,
      onChange: async (_form: any, ele: PageEle) => {
        const itemEle = getEleByJS(
          setProp(stepExtra.value.item, 'idType', 'xpath', { selfChange: false })
        )
        const idenEle = getEleByJS(setProp(ele, 'idType', 'xpath', { selfChange: false }))
        ele.index = await props.webview.executeJavaScript(`
          Array.from(${itemEle}.getElementsByTagName('${ele.tagName}')).findIndex(el => el === ${idenEle})
        `)
      }
    },
    ctype: {
      type: 'Select',
      label: '提取内容',
      rules: [{ required: true, message: '必须选择元素的提取内容！', trigger: 'change' }],
      options: Object.entries(ctypes).map(([value, { label }]) => ({ label, value })),
      onChange: (binMap: BinMap, ctype: keyof typeof ctypes) => (binMap.ctype = ctype)
    },
    metaObj: {
      type: 'Select',
      label: '绑定对象',
      placeholder: '选择元对象',
      rules: [{ required: true, message: '必须选择绑定的元对象！', trigger: 'change' }],
      options: props.metaObjs.map(mo => ({ label: mo.label, value: mo.key })),
      onChange: (binMap: BinMap, key: string) => {
        binMap.metaObj = key
        setProp(
          mapper,
          'proper.options',
          moDict.value[key].propers.map(prop => ({ label: prop.label, value: prop.key }))
        )
      }
    },
    proper: {
      type: 'Select',
      label: '对应字段',
      placeholder: '选择字段',
      rules: [{ required: true, message: '必须选择元素值填入的字段！', trigger: 'change' }],
      onChange: (binMap: BinMap, to: string) => (binMap.proper = to)
    },
    required: {
      type: 'Switch',
      label: '必要',
      placeholder: '必要的字段不存在，则该记录不会被爬取',
      chkLabels: ['非必要', '必要'],
      onChange: (binMap: BinMap, to: boolean) => (binMap.required = to)
    },
    unqProp: {
      type: 'Switch',
      label: '唯一字段',
      onChange: (binMap: BinMap, to: boolean) => (binMap.unqProp = to)
    },
    sbtBtns: {
      type: 'Buttons',
      offset: 4,
      buttons: [
        {
          ...new ButtonMapper(),
          inner: '提交',
          ghost: false,
          htmlType: 'submit',
          onClick: (binMap: BinMap) => {
            const adjBinMap = BinMap.copy(binMap)
            adjBinMap.key = uuid()
            const metaObj = props.metaObjs.find(mo => mo.key === adjBinMap.metaObj)
            const binProp = metaObj?.propers.find(p => p.key === adjBinMap.proper)
            adjBinMap.desc = `${metaObj?.label}.${binProp?.label}`
            stepExtra.value.binMaps.push(adjBinMap)
            emit('eleMetaBind', adjBinMap)
            props.emitter.emit('stop-select')
            editing.value = null
          }
        },
        {
          ...new ButtonMapper(),
          inner: '取消',
          ghost: false,
          primary: false,
          onClick: () => (editing.value = null)
        }
      ]
    }
  })
)
const moDict = computed<Record<string, MetaObj>>(() =>
  Object.fromEntries(props.metaObjs.map(mo => [mo.key, mo]))
)
const metaEmitter = new TinyEmitter()
const eleText = ref('')

function getEleIdenLabel(binMap: BinMap) {
  switch (binMap.element.idType) {
    case 'idCls':
      return (
        binMap.element.iden[0] +
        binMap.element.iden
          .split('.')
          .filter(s => s)
          .join('\n.')
      )
    case 'xpath':
      return binMap.element.iden
        .split('/')
        .filter(s => s)
        .join('\n.')
    case 'tagName':
      return `${binMap.element.iden}[${binMap.element.index}]`
  }
}
function getMetaPropLabel(binMap: BinMap) {
  return [
    getProp(moDict.value, `${binMap.metaObj}.label`),
    getProp(moDict.value, `${binMap.metaObj}.propers[{key:${binMap.proper}}].label`)
  ].join(' . ')
}
function onMetaObjClick(binMap: BinMap) {
  metaEmitter.emit('update:visible', {
    show: true,
    object: binMap,
    viewOnly: true
  })
}
async function genBinEleText(binMap: BinMap) {
  const orgIdx = await props.webview.executeJavaScript(
    'navigation.entries().find(entry => entry.sameDocument).index'
  )
  await onPreOpersExec(binMap)
  switch (binMap.ctype) {
    case 'text':
      eleText.value = await props.webview.executeJavaScript(
        `document.evaluate('${binMap.element.xpath}', document).iterateNext().textContent`
      )
      break
    case 'markdown':
      eleText.value = await props.webview
        .executeJavaScript(
          `document.evaluate('${binMap.element.xpath}', document).iterateNext().outerHTML`
        )
        .then(html => tdSvc.turndown(html))
      break
    default:
      eleText.value = ''
  }
  const curIdx = await props.webview.executeJavaScript(
    'navigation.entries().find(entry => entry.sameDocument).index'
  )
  if (orgIdx !== curIdx) {
    props.webview.goToIndex(orgIdx)
  }
}
function onUnbinMapSubmit(binMap: BinMap) {
  stepExtra.value.binMaps.splice(
    stepExtra.value.binMaps.findIndex(bm => bm.key === binMap.key),
    1
  )
  emit('eleMetaUnbind', binMap)
}
async function onPreOpersExec(binMap: BinMap) {
  const preOpers = binMap.preOpers.map(oper => ({
    element: setProp(PageEle.copy(oper.element), 'idType', 'xpath'),
    ...pickOrIgnore(oper, ['element'])
  }))
  await new Promise(resolve => props.emitter.emit('exec-opers', preOpers, resolve))
}
async function onEleIdClick(binMap: BinMap) {
  await onPreOpersExec(binMap)
  props.emitter.emit('iden-ele', binMap.element.xpath)
}
</script>
