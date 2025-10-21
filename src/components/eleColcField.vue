<template>
  <a-button class="w-full" type="primary" ghost @click="() => (addFormVsb = true)">
    添加采集元素
  </a-button>
  <FormGroup v-if="addFormVsb" layout="vertical" :mapper="mapper" :form="form">
    <template #element="{ formState }: any">
      <EleSelField :form="formState" prop="element" @sel-ele-start="onSelElStart" />
    </template>
  </FormGroup>
</template>

<script setup lang="ts">
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper, { ButtonMapper } from '@lib/types/mapper'
import { PropType, reactive, ref } from 'vue'
import ColcItem, { ctypes } from '../types/colcItem'
import EleSelField from './eleSelField.vue'
import { TinyEmitter } from 'tiny-emitter'
import PageEle from '@lib/types/pageEle'
import MetaObj from '@/types/metaObj'

const props = defineProps({
  emitter: { type: TinyEmitter, required: true },
  metaObjs: { type: Array as PropType<MetaObj[]>, default: [] }
})
const addFormVsb = ref(false)
const mapper = reactive(
  new Mapper({
    element: {
      type: 'Unknown',
      label: '页面元素'
    },
    ctype: {
      type: 'Select',
      label: '提取内容',
      options: Object.entries(ctypes).map(([value, label]) => ({ label, value }))
    },
    fkMetaobj: {
      type: 'Select',
      label: '元对象',
      options: props.metaObjs.map(mo => ({ label: mo.label, value: mo.name }))
    },
    proper: {
      type: 'Select',
      label: '对应字段'
    },
    sbtBtns: {
      type: 'Buttons',
      buttons: [
        { ...new ButtonMapper(), inner: '提交', ghost: false },
        { ...new ButtonMapper(), inner: '取消', ghost: false, primary: false }
      ]
    }
  })
)
const form = reactive(new ColcItem())

props.emitter.on('ele-selected', (selEle: PageEle) => {
  form.element = selEle
})

function onSelElStart() {
  props.emitter.emit('sel-ele')
}
</script>
