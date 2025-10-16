<template>
  <a-tag
    class="absolute rounded-none cursor-pointer"
    :style="{
      left: element.rectBox.x - offset[0] + 'px',
      top: element.rectBox.y - offset[1] + 'px'
    }"
    color="#f50"
    :closable="closable"
    @close="() => emit('ele-cancel')"
    @click="() => emit('ele-select', element)"
  >
    {{ getProp(element, eleId) }}
  </a-tag>
</template>

<script setup lang="ts">
import PageEle from '@lib/types/pageEle'
import { PropType } from 'vue'
import { getProp } from '@lib/utils'

defineProps({
  element: { type: Object as PropType<PageEle>, required: true },
  offset: { type: Array as PropType<number[]>, default: () => [0, 0] },
  eleId: { type: String as PropType<'idCls' | 'xpath' | 'none'>, default: 'idCls' },
  closable: { type: Boolean, default: true }
})
const emit = defineEmits(['ele-cancel', 'ele-select'])
</script>
