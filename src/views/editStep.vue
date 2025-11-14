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
          <template v-if="curStep.stype === 'collect'" #binMaps>
            <EleColcField
              :emitter="emitter"
              :meta-objs="metaObjs"
              :webview="pgElSelRef?.webviewRef"
              :step-extra="curStep.extra"
              @ele-meta-bind="() => updateStepExtra()"
              @ele-meta-unbind="() => updateStepExtra()"
            />
          </template>
          <template v-if="curStep.stype === 'goto'" #chromePathSFX="{ formState }">
            <a-button @click="() => onGetChromePath(formState as GotoExtra)">
              获取本地启动文件
            </a-button>
          </template>
          <template v-if="curStep.stype === 'opera'" #itemLabel="{ item, index }: any">
            <a-tooltip>
              <template #title>{{ item.element[item.element.idType] }}</template>
              <a
                v-if="item.element.idType === 'xpath'"
                class="block"
                @click="() => emitter.emit('iden-ele', item.element[item.element.idType])"
              >
                <template
                  v-for="(section, i) in item.element[item.element.idType].slice(2).split('/')"
                >
                  {{ i === 0 ? '//' : '/' }}{{ section }}
                  <br />
                </template>
              </a>
            </a-tooltip>
            <a-tag :color="getProp(otypes, `${item.otype}.color`)">
              {{ getProp(otypes, `${item.otype}.label`) }}
            </a-tag>
          </template>
        </FormGroup>
      </template>
    </PgEleSelect>
  </div>
  <a-modal
    title="爬取结果"
    v-model:open="crawlPvw.resVsb"
    width="80vw"
    :footer="null"
    :bodyStyle="{ height: '60vh' }"
    @cancel="() => (crawlPvw.data = {})"
  >
    <a-textarea
      v-if="typeof crawlPvw.data === 'string'"
      class="h-full"
      readonly
      :value="crawlPvw.data"
    />
    <EditableTable
      v-else
      v-for="metaObj in (task?.fkMetaobjs as MetaObj[])"
      :title="metaObj.label"
      :api="{ all: async () => (crawlPvw.data as Record<string, any[]>)[metaObj.key] }"
      :columns="metaObj.propers.map(prop => new Column(prop.label, prop.name))"
      :new-fun="() => Object.fromEntries(metaObj.propers.map(p => [p.name, typeDftVal(p.ptype)]))"
      :emitter="crawlPvw.emitter"
      size="small"
      :addable="false"
      :editable="false"
      :delable="false"
    >
      <template #extra>
        <a-button type="primary" :loading="loading" @click="() => onStoreToDB(metaObj.key)">
          保存到数据库
        </a-button>
      </template>
    </EditableTable>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PgEleSelect from '@lib/components/PgEleSelect.vue'
import { useRoute, useRouter } from 'vue-router'
import Task from '@/types/task'
import tskAPI from '@/apis/task'
import Step from '@/types/step'
import { CollectExtra, GotoExtra, OperaExtra } from '@/types/stpExtra'
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
import glbAPI from '@/apis/global'
import PgOper, { otypes } from '@lib/types/pgOper'

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
const curStep = computed<Step>(() => getProp(stpDict.value, route.params.sid as string))
const hlEles = computed(() => {
  const step = getProp(stpDict.value, route.params.sid as string)
  return Object.fromEntries(
    [
      ['容器', getProp(step, 'extra.container.xpath')],
      ['项', getProp(step, 'extra.item.xpath')],
      ...getProp(step, 'extra.binMaps', []).map((bm: BinMap) => [bm.desc, bm.element.xpath]),
      ...getProp(step, 'extra.opers', []).map((oper: PgOper, i: number) => [
        `操作元素${i + 1}`,
        oper.element.xpath
      ])
    ].filter(([_k, v]) => v)
  )
})
const metaObjs = computed(() => task.value?.fkMetaobjs as MetaObj[])
const crawlPvw = reactive({
  resVsb: false,
  emitter: new TinyEmitter(),
  data: {} as Record<string, any[]> | string
})

onMounted(refresh)
watch(
  () => loading.value,
  () => setProp(mapper.value, 'execute.loading', loading.value)
)

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
        await new Promise(resolve =>
          emitter.emit(
            'exec-opers',
            (step.extra as OperaExtra).opers.filter(oper => oper.otype !== 'pick'),
            resolve
          )
        )
        break
    }
  }
  let stpMapper = {}
  switch (curStep.value?.stype) {
    case 'goto':
      stpMapper = {
        chromePath: {
          type: 'Input',
          label: 'Chrome启动文件',
          placeholder: '不给出的话使用系统自带chrome浏览器',
          onChange: (form: GotoExtra, to: string) => (form.chromePath = to),
          onBlur: () => updateStepExtra()
        },
        url: {
          type: 'Input',
          label: '地址',
          rules: [{ required: true, message: '必须输入网站地址！' }],
          onChange: (form: GotoExtra, to: string) => (form.url = to),
          onBlur: () => updateStepExtra()
        },
        newPage: {
          type: 'Switch',
          label: '新页面打开',
          onChange: async (form: GotoExtra, to: boolean) => onExtValChange(form, 'newPage', to)
        }
      }
      break
    case 'collect':
      stpMapper = {
        container: {
          type: 'PageEleSel',
          label: '容器',
          emitter,
          placeholder: '将跳转到页面选择元素',
          disabled: [Cond.create('key', '==', '')],
          onSelEleClear,
          onEleIdenChange,
          onChange: (form: CollectExtra, ele: PageEle) => onExtValChange(form, 'container', ele)
        },
        item: {
          type: 'PageEleSel',
          label: '项',
          emitter,
          idAll: true,
          placeholder: '将跳转到页面选择元素',
          disabled: [Cond.create('key', '==', '')],
          onSelEleClear,
          onEleIdenChange,
          onChange: async (form: CollectExtra, ele: PageEle) => {
            const ctnrEle = getEleByJS(
              setProp(form.container, 'idType', 'xpath', { selfChange: false })
            )
            const itemEle = getEleByJS(setProp(ele, 'idType', 'xpath', { selfChange: false }))
            ele.index = await pgElSelRef.value?.webviewRef?.executeJavaScript(`
              Array.from(${ctnrEle}.getElementsByTagName('${ele.tagName}')).findIndex(el => el === ${itemEle})
            `)
            form.item = ele
            await updateStepExtra()
          }
        },
        binMaps: {
          type: 'Button',
          inner: '添加绑定项',
          label: '绑定表',
          placeholder: '将跳转到页面选择元素',
          fullWid: true,
          disabled: [Cond.create('key', '==', '')]
        },
        strategy: {
          type: 'Radio',
          label: '策略',
          options: [
            { label: '采集当页所有', value: 'all' },
            { label: '只采第一条', value: 'first' }
          ],
          style: 'button',
          onChange: (form: CollectExtra, to: 'all' | 'first') =>
            onExtValChange(form, 'strategy', to)
        }
      }
      genBinMapDesc(task.value.fkMetaobjs as MetaObj[], curStep.value.extra)
      break
    case 'opera':
      stpMapper = {
        opers: {
          type: 'EditList',
          label: '操作流程',
          mapper: new Mapper({
            element: {
              type: 'PageEleSel',
              label: '页面元素',
              emitter,
              disabled: [Cond.create('key', '==', '')],
              onSelEleClear,
              onEleIdenChange,
              onChange: (form: PgOper, ele: PageEle) => onExtValChange(form, 'element', ele)
            },
            otype: {
              type: 'Select',
              label: '操作方式',
              options: Object.entries(otypes).map(([value, { label }]) => ({ value, label })),
              onChange: (form: PgOper, to: keyof typeof otypes) => onExtValChange(form, 'otype', to)
            },
            value: {
              type: 'SelOrIpt',
              label: '值',
              display: {
                OR: [
                  Cond.create('otype', '==', 'input'),
                  Cond.create('otype', '==', 'select'),
                  Cond.create('otype', '==', 'pick')
                ]
              },
              options: ['innerText', 'innerHTML', 'outerHTML'].map(itm => ({
                value: itm,
                label: itm
              })),
              onChange: (form: PgOper, to: string) => onExtValChange(form, 'value', to)
            },
            encrypt: {
              type: 'Switch',
              label: '加密',
              display: [Cond.create('otype', '==', 'input')]
            },
            timeout: {
              type: 'Number',
              label: '延时',
              suffix: '毫秒',
              onBlur: (form: PgOper, to: number) => onExtValChange(form, 'timeout', to)
            }
          }),
          lblProp: 'element.iden',
          inline: false,
          flatItem: false,
          subProp: 'otype',
          newFun: () => PgOper.copy({}),
          onChange: (form: OperaExtra, to: PgOper[]) => onExtValChange(form, 'opers', to)
        }
      }
      break
  }
  mapper.value = new Mapper({
    ...stpMapper,
    execute: {
      type: 'Button',
      offset: 4,
      inner: '预览该步骤',
      loading: loading.value,
      fullWid: true,
      ghost: false,
      onClick: onPvwStepClick
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
function updateStepExtra(sid = route.params.sid as string) {
  return stpAPI.update(pickOrIgnore(stpDict.value[sid], ['key', 'extra'], false))
}
function genBinMapDesc(metaObjs: MetaObj[], colcExtra: CollectExtra) {
  for (const binMap of colcExtra.binMaps) {
    const metaObj = metaObjs.find(mo => mo.key === binMap.metaObj)
    const binProp = metaObj?.propers.find(p => p.name === binMap.proper)
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
  for (const record of (crawlPvw.data as Record<string, any[]>)[moKey]) {
    await rcdAPI(route.params.tid as string).add({ data: record }, moKey)
  }
  loading.value = false
  crawlPvw.emitter.emit('load', false)
  crawlPvw.resVsb = false
}
async function onGetChromePath(extra: GotoExtra) {
  extra.chromePath = await glbAPI.chrome.path()
}
async function onPvwStepClick(form: GotoExtra | CollectExtra | OperaExtra) {
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
            window.container = ${getEleByJS(extra.container)}
            if (!container) {
              throw new Error('未找到采集容器！')
            }
            window.items = ${getEleByJS(extra.item, 'container')}
            if (!items || !items.length) {
              throw new Error('未找到一篇文章！')
            }
          `)
        await getCtnrAndItem()
        const itmLen = await webview?.executeJavaScript('items.length')
        const colcData = Object.fromEntries(metaObjs.map(mo => [mo.key, [] as any[]]))
        let colced = 0
        for (let i = 0; i < itmLen; ++i) {
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
            const ele = getEleByJS(binMap.element, orgIdx === curIdx ? `items[${i}]` : undefined)
            const binMeta = metaObjs.find(m => m.key === binMap.metaObj)
            if (!binMeta) {
              continue
            }
            const colcProp = `${binMeta.key}.${binMap.proper}`
            try {
              let content = null
              switch (binMap.ctype) {
                case 'text':
                  content = await webview?.executeJavaScript(`${ele}.innerText`)
                  break
                case 'markdown':
                  content = tdSvc.turndown(await webview?.executeJavaScript(`${ele}.outerHTML`))
                  break
                case 'file':
                  break
              }
              setProp(colcItem, colcProp, content)
            } catch (e) {
              console.error(e)
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
          const chkReq = (moKey: string, item: any) => {
            const mprops = Object.keys(item)
            if (!mprops.length) {
              return false
            }
            for (const bm of extra.binMaps.filter(bm => bm.required)) {
              if (moKey !== bm.metaObj) {
                continue
              }
              if (!bm.proper || !item[bm.proper]) {
                return false
              }
            }
            return true
          }
          for (const [key, val] of Object.entries(colcItem)) {
            if (chkReq(key, val)) {
              colcData[key].push(val)
              ++colced
            }
          }
          if (colced >= (extra.strategy === 'first' ? 1 : itmLen)) {
            break
          }
        }
        crawlPvw.data = colcData
        crawlPvw.resVsb = true
      }
      break
    case 'opera':
      {
        const extra = form as OperaExtra
        if (extra.opers.find(oper => oper.otype === 'pick')) {
          crawlPvw.data = (await pgElSelRef.value?.webviewRef?.executeJavaScript(
            'JSON.stringify(' +
              extra.opers.map(oper => `${getEleByJS(oper.element)}.${oper.value}`) +
              ')'
          )) as string
          crawlPvw.resVsb = true
        } else {
          await new Promise(resolve => emitter.emit('exec-opers', extra.opers, resolve))
        }
      }
      break
  }
}
async function onExtValChange(form: any, prop: string, to: any) {
  setProp(form, prop, to)
  await updateStepExtra()
}
</script>
