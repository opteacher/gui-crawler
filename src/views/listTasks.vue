<script setup lang="ts">
import Task, { units } from '@/types/task'
import EditableTable from '@lib/components/EditableTable.vue'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { newOne, getProp } from '@lib/utils'
import { onMounted, reactive } from 'vue'
import tskAPI from '@/apis/task'
import { PlayCircleOutlined, PauseCircleOutlined, SyncOutlined } from '@ant-design/icons-vue'
import { TinyEmitter } from 'tiny-emitter'
import router from '@/router'

const columns = reactive<Column[]>([
  new Column('名称', 'name'),
  new Column('描述', 'desc'),
  new Column('开始时刻', 'start'),
  new Column('定时间隔', 'interval'),
  new Column('控制', 'ctrl')
])
const mapper = reactive<Mapper>(
  new Mapper({
    name: {
      type: 'Input',
      label: '名称'
    },
    desc: {
      type: 'Textarea',
      label: '描述'
    },
    start: {
      type: 'DateTime',
      label: '开始时刻'
    },
    interval: {
      type: 'Number',
      label: '定时间隔'
    },
    perUnit: {
      type: 'Select',
      label: '间隔单位',
      display: false,
      options: Object.entries(units).map(([value, label]) => ({ label, value }))
    }
  })
)
const emitter = new TinyEmitter()

onMounted(() => {})

async function onTaskStart(task: Task) {
  await tskAPI.start(task)
  emitter.emit('refresh')
  emitter.emit('update:auto-refresh', { enable: true, interval: 5 })
}
async function onTaskStop(task: Task) {
  await tskAPI.stop(task)
  emitter.emit('refresh')
  emitter.emit('update:auto-refresh', false)
}
</script>

<template>
  <EditableTable
    class="mx-2"
    title="定时爬虫任务"
    :api="tskAPI"
    :columns="columns"
    :mapper="mapper"
    :emitter="emitter"
    :ref-opns="['auto']"
    :new-fun="() => newOne(Task)"
  >
    <template #start="{ record }: any">
      {{ record.start.format('YYYY年MM月DD日 - HH:mm:ss') }}
    </template>
    <template #interval="{ record }: any">
      {{ record.interval }}&nbsp;{{ getProp(units, record.perUnit) }}
    </template>
    <template #intervalEDT="{ editing }: any">
      <a-form-item-rest>
        <a-input-group class="flex" compact>
          <a-input class="flex-1" v-model:value="editing.interval" />
          <a-select
            class="w-20"
            :options="mapper.perUnit.options"
            v-model:value="editing.perUnit"
          />
        </a-input-group>
      </a-form-item-rest>
    </template>
    <template #ctrl="{ record }: any">
      <a-space v-if="record.job">
        <a-popconfirm title="确定停止该任务吗？" @confirm="() => onTaskStop(record)">
          <a-button size="small" type="link" danger @click.prevent>
            <template #icon><PauseCircleOutlined /></template>
            停止
          </a-button>
        </a-popconfirm>
        <a-tooltip>
          <template #title>
            上次执行结束时间：{{ record.job.lastFinishedAt.format('MM-DD HH:mm:ss') }}
          </template>
          <a-tag color="processing">
            <template #icon>
              <SyncOutlined :spin="true" />
            </template>
            上次执行时间：{{ record.job.lastRunAt.format('MM-DD HH:mm:ss') }}
          </a-tag>
        </a-tooltip>
      </a-space>
      <a-button v-else size="small" type="link" @click="() => onTaskStart(record)">
        <template #icon><PlayCircleOutlined /></template>
        开始
      </a-button>
    </template>
    <template #operaBefore="{ record }: any">
      <a-button
        size="small"
        type="link"
        @click="() => router.push(`/gui-crawler/task/${record.key}/crawl/edit`)"
      >
        设计流程
      </a-button>
    </template>
  </EditableTable>
</template>
