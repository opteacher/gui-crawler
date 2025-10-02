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
import { v4 as uuid } from 'uuid'
import { setProp } from '@lib/utils'

const router = useRouter()
const nodes = reactive<Node[]>([])

function onNodesUpdate(nds: Node[]) {
  nodes.splice(0, nodes.length, ...nds.map(nd => setProp(nd, 'key', uuid())))
}
</script>
