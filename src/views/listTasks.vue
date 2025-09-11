<script setup lang="ts">
import Task, { units } from '@/types/task'
import EditableTable from '@lib/components/EditableTable.vue'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { newOne, getProp } from '@lib/utils'
import { reactive } from 'vue'
import tskAPI from '@/apis/task'
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons-vue'

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
</script>

<template>
  <EditableTable
    title="定时爬虫任务"
    :api="tskAPI"
    :columns="columns"
    :mapper="mapper"
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
      <a-tooltip>
        <template #title>开始</template>
        <a-button size="small" type="link" @click="() => tskAPI.start(record)">
          <template #icon><PlayCircleOutlined /></template>
        </a-button>
      </a-tooltip>
      <a-tooltip>
        <template #title>停止</template>
        <a-button size="small" type="link">
          <a-button size="small" type="link" danger @click="() => tskAPI.stop(record)">
            <template #icon><PauseCircleOutlined /></template>
          </a-button>
        </a-button>
      </a-tooltip>
    </template>
  </EditableTable>
</template>
