<script setup lang="ts">
import Task from '@/types/task'
import EditableTable from '@lib/components/EditableTable.vue'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { newOne } from '@lib/utils'
import { reactive } from 'vue'

const columns = reactive<Column[]>([
  new Column('名称', 'name'),
  new Column('描述', 'desc'),
  new Column('开始时刻', 'start'),
  new Column('定时间隔', 'interval')
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
      options: Object.entries({
        y: '年',
        M: '月',
        w: '周',
        D: '天',
        h: '小时',
        m: '分钟',
        s: '秒',
        ms: '毫秒'
      }).map(([value, label]) => ({ label, value }))
    }
  })
)
</script>

<template>
  <EditableTable
    :api="{ all: () => [] }"
    :columns="columns"
    :mapper="mapper"
    :new-fun="() => newOne(Task)"
  >
    <template #intervalEDT="{ editing }: any">
      <a-form-item-rest>
        <a-input-group class="flex" compact>
          <a-input class="flex-1" v-model:value="editing.interval" />
          <a-select class="w-20" :options="mapper.perUnit.options" v-model:value="editing.perUnit" />
        </a-input-group>
      </a-form-item-rest>
    </template>
  </EditableTable>
</template>
