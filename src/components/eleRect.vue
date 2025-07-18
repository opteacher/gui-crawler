<template>
  <rect
    :class="{ 'cursor-pointer': selable }"
    :x="element.rectBox.x - offset[0]"
    :y="element.rectBox.y - offset[1]"
    :width="element.rectBox.width"
    :height="element.rectBox.height"
    :style="{
      'fill-opacity': 0,
      'stroke-width': stkWid,
      stroke: '#f50'
    }"
    @click="() => emit('ele-select', element)"
  />
</template>

<script setup lang="ts">
import PageEle from '@/types/pageEle'
import { PropType } from 'vue'

defineProps({
  element: { type: Object as PropType<PageEle>, required: true },
  offset: { type: Array as PropType<number[]>, default: () => [0, 0] },
  stkWid: { type: Number, default: 1 },
  selable: { type: Boolean, default: true }
})
const emit = defineEmits(['ele-select'])
</script>
