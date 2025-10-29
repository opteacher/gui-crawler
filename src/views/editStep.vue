<template>
  <div class="h-full flex flex-col">
    <a-page-header :title="task?.name" :sub-title="curStep?.title" @back="() => router.back()">
      <template #extra>
        <div class="w-[50vw] flex space-x-3">
          <a-input-group class="w-16" compact size="large">
            <a-button
              :disabled="loading || !pgElSelRef?.webviewRef?.canGoBack()"
              @click="pgElSelRef?.webviewRef?.goBack()"
            >
              <template #icon><LeftOutlined /></template>
            </a-button>
            <a-button
              :disabled="loading || !pgElSelRef?.webviewRef?.canGoForward()"
              @click="pgElSelRef?.webviewRef?.goForward()"
            >
              <template #icon><RightOutlined /></template>
            </a-button>
          </a-input-group>
          <a-input-group class="flex-1 flex" compact size="large">
            <a-input class="flex-1" v-model:value="url">
              <template #prefix><SendOutlined /></template>
              <template #suffix>
                <a @click="() => emitter.emit('reload', true)"><SyncOutlined /></a>
              </template>
            </a-input>
            <a-button type="primary" @click="() => onGotoByURL()">跳转</a-button>
          </a-input-group>
        </div>
      </template>
    </a-page-header>
    <PgEleSelect
      class="flex-1"
      ref="pgElSelRef"
      :url="curURL"
      v-model:loading="loading"
      :hl-eles="hlEles"
      :sbar-wid="500"
      :addr-bar="false"
      :emitter="emitter"
      :update:url="(u: string) => (url = u)"
    >
      <template #sideBottom>
        <FormGroup
          :disabled="loading"
          class="p-5 overflow-auto"
          :mapper="mapper"
          :form="curStep?.extra"
        >
          <template v-if="curStep?.stype === 'collect'" #binMaps>
            <EleColcField
              :emitter="emitter"
              :meta-objs="metaObjs"
              :webview="pgElSelRef?.webviewRef"
              :step-extra="curStep.extra"
              @ele-meta-bind="() => updateStepExtra()"
              @ele-meta-unbind="() => updateStepExtra()"
            />
          </template>
        </FormGroup>
      </template>
    </PgEleSelect>
  </div>
  <a-modal
    title="爬取结果"
    v-model:open="crawlPvw.resVsb"
    width="80vw"
    :bodyStyle="{ height: '60vh' }"
  >
    <EditableTable
      v-for="metaObj in (task?.fkMetaobjs as MetaObj[])"
      :title="metaObj.label"
      :api="{ all: async () => crawlPvw.data[metaObj.key] }"
      :columns="metaObj.propers.map(prop => new Column(prop.label, prop.name))"
      :new-fun="() => Object.fromEntries(metaObj.propers.map(p => [p.name, typeDftVal(p.ptype)]))"
      :emitter="crawlPvw.emitter"
      size="small"
      :addable="false"
      :editable="false"
      :delable="false"
    >
      <template #extra>
        <a-button type="primary" :loading="loading" @click="() => onStoreToDB(metaObj.key)">保存到数据库</a-button>
      </template>
    </EditableTable>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import PgEleSelect from '@lib/components/PgEleSelect.vue'
import { useRoute, useRouter } from 'vue-router'
import Task from '@/types/task'
import tskAPI from '@/apis/task'
import Step, { CollectExtra, GotoExtra } from '@/types/step'
import stpAPI from '@/apis/step'
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper from '@lib/types/mapper'
import { TinyEmitter } from 'tiny-emitter'
import { getProp, pickOrIgnore, setProp, getEleByJS } from '@lib/utils'
import EleColcField from '@/components/eleColcField.vue'
import MetaObj from '@/types/metaObj'
import BinMap from '@/types/binMap'
import { Cond } from '@lib/types'
import PageEle from '@lib/types/pageEle'
import { LeftOutlined, RightOutlined, SendOutlined, SyncOutlined } from '@ant-design/icons-vue'
import EditableTable from '@lib/components/EditableTable.vue'
import Column from '@lib/types/column'
import { typeDftVal } from '@lib/types'
import TurndownService from 'turndown'
import rcdAPI from '@/apis/record'

const route = useRoute()
const router = useRouter()
const tdSvc = new TurndownService()
const curURL = ref('')
const url = ref('')
const pgElSelRef = ref<InstanceType<typeof PgEleSelect>>()
const task = ref<Task>()
const stpDict = ref<Record<string, Step>>({})
const mapper = ref<Mapper>(new Mapper({}))
const emitter = new TinyEmitter()
const loading = ref(false)
const curStep = computed<Step | undefined>(() => getProp(stpDict.value, route.params.sid as string))
const hlEles = computed(() => {
  const step = getProp(stpDict.value, route.params.sid as string)
  return Object.fromEntries(
    [
      ['采集容器', getProp(step, 'extra.container.xpath')],
      ['采集项', getProp(step, 'extra.item.xpath')],
      ...getProp(step, 'extra.binMaps', []).map((bm: BinMap) => [bm.desc, bm.element.xpath])
    ].filter(([_k, v]) => v)
  )
})
const metaObjs = computed(() => task.value?.fkMetaobjs as MetaObj[])
const crawlPvw = reactive({
  resVsb: false,
  emitter: new TinyEmitter(),
  data: {} as Record<string, any[]>
})

onMounted(refresh)

async function refresh() {
  loading.value = true
  const tskKey = route.params.tid as string
  task.value = await tskAPI.get(tskKey)
  const steps = await stpAPI.all({ axiosConfig: { params: { fkTask: tskKey } } })
  stpDict.value = Object.fromEntries(steps.map(s => [s.key, s] as const))
  const stpKey = route.params.sid as string
  if (!steps.length) {
    return
  }
  // 执行到当前步骤
  for (let i = 0; i < steps.length; ++i) {
    const step = steps[i]
    if (i !== 0 && step.key === stpKey) {
      break
    }
    switch (step.stype) {
      case 'goto':
        url.value = step?.extra.url
        curURL.value = url.value
        break
      case 'opera':
        break
    }
  }
  let stpMapper = {}
  switch (curStep.value?.stype) {
    case 'goto':
      stpMapper = {
        url: {
          type: 'Input',
          label: '地址',
          rules: [{ required: true, message: '必须输入网站地址！' }]
        },
        newPage: {
          type: 'Switch',
          label: '新页面打开'
        }
      }
      break
    case 'collect':
      stpMapper = {
        container: {
          type: 'PageEleSel',
          label: '采集容器',
          emitter,
          placeholder: '将跳转到页面选择元素',
          disabled: [Cond.create('key', '==', '')],
          onSelEleClear,
          onEleIdenChange
        },
        item: {
          type: 'PageEleSel',
          label: '采集项',
          emitter,
          placeholder: '将跳转到页面选择元素',
          disabled: [Cond.create('key', '==', '')],
          onSelEleClear,
          onEleIdenChange
        },
        binMaps: {
          type: 'Button',
          inner: '添加采集项',
          label: '采集表',
          placeholder: '将跳转到页面选择元素',
          fullWid: true,
          disabled: [Cond.create('key', '==', '')]
        },
        strategy: {
          type: 'Radio',
          label: '采集策略',
          options: [
            { label: '采集当页所有', value: 'all' },
            { label: '只采第一条', value: 'first' }
          ],
          style: 'button',
          onChange: async (form: CollectExtra, to: 'all' | 'first') => {
            form.strategy = to
            await updateStepExtra()
          }
        }
      }
      genBinMapDesc(task.value.fkMetaobjs as MetaObj[], curStep.value.extra)
      break
  }
  mapper.value = new Mapper({
    ...stpMapper,
    execute: {
      type: 'Button',
      offset: 4,
      inner: '预览该步骤',
      loading: () => loading.value,
      fullWid: true,
      ghost: false,
      onClick: async (form: GotoExtra | CollectExtra) => {
        switch (curStep.value?.stype) {
          case 'goto':
            onGotoByURL((form as GotoExtra).url)
            break
          case 'collect':
            {
              const extra = form as CollectExtra
              const metaObjs = task.value?.fkMetaobjs as MetaObj[]
              const webview = pgElSelRef.value?.webviewRef
              const getCtnrAndItem = () =>
                webview?.executeJavaScript(`
                  const container = ${getEleByJS(extra.container)}
                  if (!container) {
                    throw new Error('未找到采集容器！')
                  }
                  const items = ${getEleByJS(extra.item, 'container', false)}
                  if (!items || !items.length) {
                    throw new Error('未找到一篇文章！')
                  }
                `)
              await getCtnrAndItem()
              const itmLen = await webview?.executeJavaScript('items.length')
              const colcData = Object.fromEntries(metaObjs.map(mo => [mo.key, [] as any[]]))
              for (let i = 0; i < (extra.strategy === 'first' ? 1 : itmLen); ++i) {
                const colcItem = Object.fromEntries(metaObjs.map(mo => [mo.key, {}]))
                for (const binMap of extra.binMaps) {
                  const orgIdx = await webview?.executeJavaScript(
                    'navigation.entries().find(entry => entry.sameDocument).index'
                  )
                  await new Promise(resolve =>
                    emitter.emit('exec-opers', binMap.preOpers, resolve, `items[${i}]`)
                  )
                  const curIdx = await webview?.executeJavaScript(
                    'navigation.entries().find(entry => entry.sameDocument).index'
                  )
                  // 前置操作未造成页面变化，则使用items[i]作为父；反之页面已变，则全页面搜索元素
                  const ele = getEleByJS(
                    binMap.element,
                    orgIdx === curIdx ? `items[${i}]` : undefined
                  )
                  const binMeta = metaObjs.find(m => m.key === binMap.metaObj)
                  const binProp = binMeta?.propers.find(p => p.key === binMap.proper)
                  if (!binMeta || !binProp) {
                    continue
                  }
                  try {
                    switch (binMap.ctype) {
                      case 'text':
                        setProp(
                          colcItem,
                          `${binMeta.key}.${binProp.name}`,
                          await webview?.executeJavaScript(`${ele}.innerText`)
                        )
                        break
                      case 'markdown':
                        setProp(
                          colcItem,
                          `${binMeta.key}.${binProp.name}`,
                          tdSvc.turndown(await webview?.executeJavaScript(`${ele}.outerHTML`))
                        )
                        break
                      case 'file':
                        break
                    }
                  } catch (e) {
                    continue
                  } finally {
                    if (orgIdx !== curIdx) {
                      // 页面跳转，回到原始页面
                      emitter.emit('goto-history', orgIdx)
                      // 页面跳转，重新获取容器和项
                      await getCtnrAndItem()
                    }
                  }
                }
                for (const [key, val] of Object.entries(colcItem)) {
                  if (Object.keys(val).length) {
                    colcData[key].push(val)
                  }
                }
              }
              crawlPvw.data = colcData
              crawlPvw.resVsb = true
            }
            break
        }
      }
    }
  })
}
async function onSelEleClear(prop: string) {
  if (!route.params.sid) {
    return
  }
  const sid = route.params.sid as string
  setProp(stpDict.value, `${sid}.extra.${prop}`, new PageEle())
  await updateStepExtra()
  emitter.emit('stop-select')
}
async function onEleIdenChange(prop: string, iden: string) {
  if (!route.params.sid) {
    return
  }
  const sid = route.params.sid as string
  setProp(stpDict.value, `${sid}.extra.${prop}.idType`, iden)
  await updateStepExtra()
}
async function updateStepExtra(sid = route.params.sid as string) {
  return stpAPI.update(pickOrIgnore(stpDict.value[sid], ['key', 'extra'], false))
}
function genBinMapDesc(metaObjs: MetaObj[], colcExtra: CollectExtra) {
  for (const binMap of colcExtra.binMaps) {
    const metaObj = metaObjs.find(mo => mo.key === binMap.metaObj)
    const binProp = metaObj?.propers.find(p => p.key === binMap.proper)
    binMap.desc = `${metaObj?.label}.${binProp?.label}`
  }
}
function onGotoByURL(u?: string) {
  if (u) {
    url.value = u
  }
  curURL.value = url.value
  emitter.emit('reload')
}
async function onStoreToDB(moKey: string) {
  loading.value = true
  crawlPvw.emitter.emit('load', true)
  for (const record of crawlPvw.data[moKey]) {
    await rcdAPI(route.params.tid as string).add({ data: record }, moKey)
  }
  loading.value = false
  crawlPvw.emitter.emit('load', false)
  crawlPvw.resVsb = false
}
</script>
