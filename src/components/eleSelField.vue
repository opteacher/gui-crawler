<template>
  <a-button
    v-if="!getProp(form, prop)"
    class="w-full"
    :type="selProp === prop ? 'primary' : 'default'"
    @click="() => emit('selEleStart', prop)"
  >
    选择元素
  </a-button>
  <a-input-group v-else compact class="flex">
    <a-dropdown class="flex-1 truncate">
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
    <a-popconfirm title="确定解绑该元素吗？" @confirm="() => emit('selEleClear', props.prop)">
      <a-button type="primary" ghost danger>
        <template #icon><CloseOutlined /></template>
      </a-button>
    </a-popconfirm>
  </a-input-group>
</template>

<script setup lang="ts">
import { getProp } from '@lib/utils'
import { CloseOutlined, DownOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  prop: { type: String, required: true },
  selProp: { type: String, default: '' }
})
const emit = defineEmits(['selEleClear', 'selEleStart', 'eleIdenChange'])
const idType = computed(() => getProp(props.form, `${props.prop}.idType`))

function onElIdChange({ key }: any) {
  emit('eleIdenChange', key)
}
</script>
