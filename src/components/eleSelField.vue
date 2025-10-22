<template>
  <a-button
    v-if="!getProp(form, prop) || !getProp(form, `${prop}.xpath`)"
    class="w-full"
    :type="selProp === prop ? 'primary' : 'default'"
    @click="onSelEleStart"
  >
    选择元素
  </a-button>
  <a-input-group v-else compact class="flex">
    <a-dropdown class="flex-1 truncate" :trigger="['click']">
      <template #overlay>
        <a-menu @click="onElIdChange">
          <a-menu-item key="xpath">xpath</a-menu-item>
          <a-menu-item key="idCls">ID或类</a-menu-item>
          <a-menu-item key="tagName">标签</a-menu-item>
        </a-menu>
      </template>
      <a-button type="primary" ghost>
        {{ getProp(form, `${prop}.${idType}`) }}
        <DownOutlined />
      </a-button>
    </a-dropdown>
    <a-popconfirm title="确定解绑该元素吗？" @confirm="onSelEleClear">
      <a-button type="primary" ghost danger>
        <template #icon><CloseOutlined /></template>
      </a-button>
    </a-popconfirm>
  </a-input-group>
</template>

<script setup lang="ts">
import { getProp, setProp } from '@lib/utils'
import { CloseOutlined, DownOutlined } from '@ant-design/icons-vue'
import { computed, toRef } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  prop: { type: String, required: true },
  selProp: { type: String, default: '' }
})
const emit = defineEmits(['selEleClear', 'selEleStart', 'eleIdenChange'])
const selProp = toRef(props.selProp)
const form = toRef(props.form)
const idType = computed(() => getProp(form.value, `${props.prop}.idType`))

function onSelEleStart() {
  selProp.value = selProp.value ? '' : props.prop
  emit('selEleStart', props.prop)
}
function onElIdChange({ key }: any) {
  setProp(form.value, props.prop + '.idType', key)
  emit('eleIdenChange', props.prop, key)
}
function onSelEleClear() {
  setProp(form.value, props.prop, undefined)
  emit('selEleClear', props.prop)
}
</script>
