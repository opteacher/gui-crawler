<template>
  <FormGroup v-if="editing" :mapper="mapper" :form="editing">
    <template #element="{ formState }: any">
      <EleSelField :form="formState" prop="element" :emitter="emitter" />
    </template>
  </FormGroup>
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
          <a @click="() => props.emitter.emit('iden-ele', binMap.element.xpath)">
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
  <FormDialog title="元对象" width="40vw" :mapper="new Mapper(metaMapper)" :emitter="metaEmitter" />
</template>

<script setup lang="ts">
import FormGroup from '@lib/components/FormGroup.vue'
import FormDialog from '@lib/components/FormDialog.vue'
import Mapper, { ButtonMapper } from '@lib/types/mapper'
import { computed, PropType, reactive, ref, toRef } from 'vue'
import BinMap, { ctypes } from '../types/binMap'
import EleSelField from './eleSelField.vue'
import { TinyEmitter } from 'tiny-emitter'
import PageEle from '@lib/types/pageEle'
import MetaObj, { metaMapper } from '@/types/metaObj'
import { setProp, getProp } from '@lib/utils'
import { CollectExtra } from '@/types/step'
import { MinusCircleOutlined } from '@ant-design/icons-vue'
import { v4 as uuid } from 'uuid'

const props = defineProps({
  emitter: { type: TinyEmitter, required: true },
  metaObjs: { type: Array as PropType<MetaObj[]>, default: [] },
  stepExtra: { type: Object as PropType<CollectExtra>, required: true },
  webview: { type: Object as PropType<Electron.WebviewTag>, default: null }
})
const emit = defineEmits(['eleMetaBind', 'eleMetaUnbind'])
const stepExtra = toRef(props.stepExtra)
const editing = ref<BinMap | null>(null)
const mapper = reactive(
  new Mapper({
    element: {
      type: 'Unknown',
      label: '页面元素',
      rules: [
        {
          required: true,
          message: '必须选择待提取的页面元素！',
          validator: (rule: any, value: PageEle, callback: (errMsg: string) => void) => {
            callback(value.xpath ? undefined : rule.message)
          }
        }
      ]
    },
    ctype: {
      type: 'Select',
      label: '提取内容',
      rules: [{ required: true, message: '必须选择元素的提取内容！', trigger: 'change' }],
      options: Object.entries(ctypes).map(([value, { label }]) => ({ label, value }))
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
            const adjBinMap = setProp(BinMap.copy(binMap), 'key', uuid())
            stepExtra.value.binMaps.push(adjBinMap)
            emit('eleMetaBind', adjBinMap)
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
      return binMap.element.iden
        .split(' ')
        .filter(s => s)
        .join('\n.')
    case 'xpath':
      return binMap.element.iden
        .split('/')
        .filter(s => s)
        .join('\n.')
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
    object: moDict.value[binMap.metaObj as string],
    viewOnly: true
  })
}
async function genBinEleText(binMap: BinMap) {
  switch (binMap.ctype) {
    case 'text':
      eleText.value = await props.webview.executeJavaScript(
        `document.evaluate('${binMap.element.xpath}', document).iterateNext().textContent`
      )
      break
    default:
      eleText.value = ''
  }
}
function onUnbinMapSubmit(binMap: BinMap) {
  stepExtra.value.binMaps.splice(
    stepExtra.value.binMaps.findIndex(bm => bm.key === binMap.key),
    1
  )
  emit('eleMetaUnbind', binMap)
}
</script>
