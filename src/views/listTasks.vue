<script setup lang="ts">
import Task, { units } from '@/types/task'
import EditableTable from '@lib/components/EditableTable.vue'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { newOne, getProp } from '@lib/utils'
import { onMounted, reactive, watch } from 'vue'
import tskAPI from '@/apis/task'
import { PlayCircleOutlined, PauseCircleOutlined, SyncOutlined } from '@ant-design/icons-vue'
import { TinyEmitter } from 'tiny-emitter'
import router from '@/router'
import MetaObj from '@/types/metaObj'
import rcdAPI from '@/apis/record'
import { typeDftVal } from '@lib/types'
import Paho from 'paho-mqtt'

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
const records = reactive({
  emitter: new TinyEmitter()
})
const logger = reactive<{
  client?: Paho.Client
  visible: boolean
  content: string
}>({
  client: undefined,
  visible: false,
  content: ''
})

onMounted(() => {})
watch(
  () => logger.visible,
  (vsb: boolean) => {
    logger.content = ''
    if (vsb) {
      logger.client = new Paho.Client('192.168.1.11', 8083, 'emqx_gclog_6e8f21')
      logger.client.onConnectionLost = responseObject => {
        if (responseObject.errorCode !== 0) {
          console.log('onConnectionLost:' + responseObject.errorMessage)
        }
      }
      logger.client.onMessageArrived = message => {
        console.log('onMessageArrived:' + message.payloadString)
        logger.content += message.payloadString
      }
      logger.client.connect({
        onSuccess: () => {
          // Once a connection has been made, make a subscription and send a message.
          console.log('onConnect')
          logger.client?.subscribe('World')
          const message = new Paho.Message('Hello')
          message.destinationName = 'World'
          logger.client?.send(message)
        }
      })
    } else if (logger.client && logger.client.isConnected()) {
      logger.client.disconnect()
    }
  }
)

async function onTaskStart(task: Task) {
  await tskAPI.start(task)
  logger.visible = true
  emitter.emit('refresh')
  emitter.emit('update:auto-refresh', { enable: true, interval: 5 })
}
async function onTaskStop(task: Task) {
  await tskAPI.stop(task)
  emitter.emit('refresh')
  emitter.emit('update:auto-refresh', false)
}
async function onRecordExpand(task: Task) {
  records.emitter.emit('load', true)
  task.fkMetaobjs = await tskAPI.get(task.key).then(tsk => tsk.fkMetaobjs)
  task.rcdDict = {}
  for (const record of await rcdAPI(task.key).all()) {
    const moKey = record.fkMetaobj as string
    if (moKey in task.rcdDict) {
      task.rcdDict[moKey].push(record.data)
    } else {
      task.rcdDict[moKey] = [record.data]
    }
  }
  records.emitter.emit('load', false)
  records.emitter.emit('refresh')
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
    @expand="onRecordExpand"
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
          <a-tag class="hover:cursor-pointer" color="processing" @click="() => (logger.visible = true)">
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
        @click="() => router.push(`/gui-crawler/task/${record.key}/flow/oper`)"
      >
        设计流程
      </a-button>
    </template>
    <template #expandedRowRender="{ record: task }: { record: Task }">
      <EditableTable
        v-for="metaObj in (task.fkMetaobjs as MetaObj[])"
        :title="metaObj.label"
        :api="{ all: async () => task.rcdDict[metaObj.key] || [] }"
        :columns="(metaObj.propers || []).map(p => new Column(p.label, p.name))"
        :new-fun="
          () => Object.fromEntries((metaObj.propers || []).map(p => [p.name, typeDftVal(p.ptype)]))
        "
        :emitter="records.emitter"
        size="small"
        :addable="false"
        :editable="false"
        :delable="false"
      />
    </template>
  </EditableTable>
  <a-drawer
    v-model:open="logger.visible"
    title="任务日志"
    placement="right"
  >
    <pre>{{ logger.content }}</pre>
  </a-drawer>
</template>
