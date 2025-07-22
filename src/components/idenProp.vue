<template>
  <a-input-group v-if="element" class="w-full flex" compact>
    <a-button class="flex-1" @click="() => emit('ele-select', element)">
      {{ element.clazz }}
    </a-button>
    <a-button @click="() => emit('ele-clear')">
      <template #icon><CloseOutlined /></template>
    </a-button>
  </a-input-group>
  <a-button
    v-else
    class="w-full"
    type="primary"
    :ghost="idenEle !== prop"
    @click="() => emit('update:idenEle', idenEle ? '' : prop)"
  >
    指定为当前元素
  </a-button>
</template>

<script setup lang="ts">
import PageEle from '@/types/pageEle'
import { CloseOutlined } from '@ant-design/icons-vue'
import { PropType } from 'vue'

defineProps({
  prop: { type: String, default: '' },
  element: { type: Object as PropType<PageEle | null>, default: null },
  idenEle: { type: String, default: '' }
})
const emit = defineEmits(['ele-select', 'ele-clear', 'update:idenEle'])
</script>
