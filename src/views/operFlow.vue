<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <a-page-header title="Title" sub-title="This is a subtitle" @back="() => router.back()" />
    <FlowDsgn :nodes="nodes" @update:nodes="onNodesUpdate" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import FlowDsgn from '@lib/components/FlowDsgn.vue'
import { reactive } from 'vue'
import Node from '@lib/types/node'

const router = useRouter()
const nodes = reactive<Node[]>([])

function onNodesUpdate(nds: Node[]) {
  nodes.splice(0, nodes.length, ...nds)
}
</script>
