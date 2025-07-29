<template>
  <EleSelector
    :prop="pname"
    :element="form[pname]"
    v-model:iden-ele="form.idenEle"
    @ele-select="onEleIden"
    @ele-clear="() => (form[pname] = null)"
  />
</template>

<script setup lang="ts">
import type PageEle from '@/types/pageEle'
import EleSelector from './eleSelector.vue'

const props = defineProps({
  form: { type: Object, required: true },
  pname: { type: String, required: true }
})
const emit = defineEmits(['ele-select', 'ele-clear'])

function onEleIden(ele?: PageEle) {
  emit('ele-select', ele)
  emit('ele-clear')
  props.form.pgStgsChg = true
}
</script>