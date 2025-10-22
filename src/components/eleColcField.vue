<template>
  <FormGroup v-if="editing" :mapper="mapper" :form="editing">
    <template #element="{ formState }: any">
      <EleSelField :form="formState" prop="element" @sel-ele-start="onSelElStart" />
    </template>
  </FormGroup>
  <a-button v-else class="w-full" type="primary" ghost @click="() => (editing = new BinMap())">
    添加采集元素
  </a-button>
</template>

<script setup lang="ts">
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper, { ButtonMapper } from '@lib/types/mapper'
import { PropType, reactive, ref, toRef } from 'vue'
import BinMap, { ctypes } from '../types/binMap'
import EleSelField from './eleSelField.vue'
import { TinyEmitter } from 'tiny-emitter'
import PageEle from '@lib/types/pageEle'
import MetaObj from '@/types/metaObj'
import { setProp } from '@lib/utils'
import { CollectExtra } from '@/types/step'

const props = defineProps({
  emitter: { type: TinyEmitter, required: true },
  metaObjs: { type: Array as PropType<MetaObj[]>, default: [] },
  stepExtra: { type: Object as PropType<CollectExtra>, required: true }
})
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
      options: Object.entries(ctypes).map(([value, label]) => ({ label, value }))
    },
    fkMetaobj: {
      type: 'Select',
      label: '绑定对象',
      placeholder: '选择元对象',
      rules: [{ required: true, message: '必须选择绑定的元对象！', trigger: 'change' }],
      options: props.metaObjs.map(mo => ({ label: mo.label, value: mo.key })),
      onChange: (binMap: BinMap, key: string) => {
        binMap.fkMetaobj = key
        const metaObj = props.metaObjs.find(mo => mo.key === key)
        setProp(
          mapper,
          'proper.options',
          metaObj?.propers.map(prop => ({ label: prop.label, value: prop.key }))
        )
      }
    },
    proper: {
      type: 'Select',
      label: '对应字段',
      placeholder: '选择字段',
      rules: [{ required: true, message: '必须选择元素值填入的字段！', trigger: 'change' }],
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
            console.log(stepExtra.value)
            stepExtra.value.binMaps.push(BinMap.copy(binMap))
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

props.emitter.on('ele-selected', (selEle: PageEle) => {
  if (editing.value) {
    editing.value.element = selEle
  }
})

function onSelElStart() {
  props.emitter.emit('sel-ele')
}
</script>
