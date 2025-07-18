<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import {
  DashboardOutlined,
  ScheduleOutlined,
  FieldTimeOutlined,
  DisconnectOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import FlexDivider from '@lib/components/FlexDivider.vue'
import { TinyEmitter } from 'tiny-emitter'
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper from '@lib/types/mapper'
import { setProp, swchBoolProp } from '@lib/utils'
import _ from 'lodash'
import PageEle from '@/types/pageEle'
import { inRect } from '@/utils'
import { Cond } from '@lib/types'
import EleRect from '@/components/eleRect.vue'
import EleTag from '@/components/eleTag.vue'

const selKeys = ref(['define'])
const webView = ref<HTMLIFrameElement | null>(null)
const webViewCtnr = ref<HTMLElement | null>(null)
const urlForm = reactive({ url: 'https://www.jiuyangongshe.com/' })
const wvMask = reactive({
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  elements: [] as PageEle[],
  treeData: [],
  hovEle: null as PageEle | null,
  selEle: null as PageEle | null
})
const sideBar = reactive({
  width: 400,
  showLeft: true,
  widEmitter: new TinyEmitter(),
  mapper: new Mapper({
    toolbox: {
      type: 'FormGroup',
      label: '工具箱',
      fold: true,
      items: new Mapper({
        widHgt: {
          type: 'Unknown',
          label: '长宽',
          desc: '确保页面在视图中完全展示'
        },
        mode: {
          type: 'Radio',
          label: '视图',
          style: 'button',
          options: [
            { label: '选择模式', value: 'select' },
            { label: '浏览模式', value: 'view' }
          ]
        },
        selEle: {
          type: 'Button',
          label: '选择元素',
          inner: '点击选择',
          disabled: [Cond.create('mode', '!=', 'select')],
          onClick: () => {
            swchBoolProp(sideBar.formState, 'selEle')
            swchBoolProp(sideBar.mapper, 'toolbox.items.selEle.ghost')
            if (!sideBar.formState.selEle) {
              wvMask.hovEle = null
            }
          }
        },
        showEleId: {
          type: 'Radio',
          label: '显示元素ID',
          style: 'button',
          options: [
            { label: '类名', value: 'clazz' },
            { label: 'xpath', value: 'xpath' },
            { label: '不显示', value: 'none' }
          ]
        }
      })
    },
    pageSettings: {
      type: 'FormGroup',
      label: '页面配置',
      fold: true,
      items: new Mapper({
        iden: {
          type: 'Select',
          label: '页面类型',
          options: [
            { label: '列表', value: 'list' },
            { label: '详细', value: 'detail' }
          ]
        },
        listCtnr: {
          type: 'Button',
          label: '列表容器',
          inner: '指定为当前元素',
          display: [Cond.create('iden', '=', 'list')],
          disabled: wvMask.selEle === null,
          onClick: () =>
            setProp(
              sideBar.mapper,
              'pageSettings.items.listCtnr.inner',
              wvMask.selEle?.clazz || '指定为当前元素'
            )
        },
        listItem: {
          type: 'Button',
          label: '列表元素',
          inner: '指定为当前元素',
          display: [Cond.create('iden', '=', 'list')],
          disabled: wvMask.selEle === null,
          onClick: () =>
            setProp(
              sideBar.mapper,
              'pageSettings.items.listItem.inner',
              wvMask.selEle?.clazz || '指定为当前元素'
            )
        }
      })
    },
    colcEles: {
      type: 'FormGroup',
      label: '采集元素',
      fold: true,
      items: new Mapper({
        addEle: {
          type: 'Button',
          label: '',
          inner: '添加采集体',
          onClick: () => setProp(sideBar.formState, 'addEle', true),
        },
        eleProp: {
          type: 'EditList',
          label: '字段',
          display: [Cond.create('addEle', '=', true)],
          mapper: new Mapper({
            clazz: {
              type: 'Button',
              label: '类名',
              inner: '指定为当前元素'
            }
          })
        }
      })
    }
  }),
  formState: {
    widHgt: [2000, 10000],
    mode: 'view',
    selEle: false,
    showEleId: 'clazz' as 'clazz' | 'xpath' | 'none',
    addEle: false
  }
})
const curURL = ref('')

watch(
  () => sideBar.formState.mode,
  newMode => {
    if (newMode === 'select') {
      sideBar.formState.selEle = true
      setProp(sideBar.mapper, 'toolbox.items.selEle.ghost', false)
    }
  }
)

function onSbFormUpdate(fm: any) {
  Object.entries(fm).map(([k, v]) => setProp(sideBar.formState, k, v))
}
async function onWebviewLoaded() {
  // console.log(
  //   await reqGet('page/element', 's', {
  //     project: 'login_platform',
  //     type: 'api',
  //     action: 'collect',
  //     axiosConfig: { params: { url: curURL.value, ...webView.value?.getBoundingClientRect() } }
  //   })
  // )
  const { elements, treeData, rectBox } = await window.ipcRenderer.invoke(
    'collect-elements',
    curURL.value
  )
  wvMask.elements = elements
  wvMask.treeData = treeData

  sideBar.formState.widHgt = [rectBox.width || 2000, rectBox.height || 10000]
}
function onMouseMove(e: MouseEvent) {
  sideBar.widEmitter.emit('mousemove', e)
}
function onMouseUp() {
  sideBar.widEmitter.emit('mouseup')
}
function poiOnEle(x: number, y: number): PageEle | null {
  const els = []
  for (const el of wvMask.elements) {
    if (inRect({ x, y }, el.rectBox)) {
      els.push(el)
    }
  }
  const minRect = {
    width: Number.MAX_VALUE,
    height: Number.MAX_VALUE,
    el: null as PageEle | null
  }
  for (const el of els) {
    if (el.rectBox.width < minRect.width && el.rectBox.height < minRect.height) {
      minRect.el = el
    }
  }
  return minRect.el
}
function onMosMovOnWebview(e: MouseEvent) {
  e.preventDefault()
  if (!sideBar.formState.selEle) {
    return
  }
  wvMask.hovEle = poiOnEle(e.offsetX + wvMask.left, e.offsetY + wvMask.top)
}
function onEleSelect() {
  wvMask.selEle = wvMask.hovEle
  wvMask.hovEle = null
  sideBar.formState.selEle = false
  setProp(sideBar.mapper, 'toolbox.items.selEle.ghost', true)
  setProp(sideBar.mapper, 'pageSettings.items.listCtnr.disabled', false)
}
function onEleClrSel() {
  wvMask.selEle = null
  setProp(sideBar.mapper, 'pageSettings.items.listCtnr.disabled', true)
}
function onMainLytScroll(e: any) {
  wvMask.top = (e.target as HTMLElement).scrollTop
  wvMask.left = (e.target as HTMLElement).scrollLeft
}
function onWidHgtChange(e: FocusEvent, whIdx: 0 | 1) {
  sideBar.formState.widHgt[whIdx] = parseInt((e.target as HTMLInputElement).value)
}
function onMaskScroll(e: WheelEvent) {
  webViewCtnr.value?.scroll({ top: webViewCtnr.value?.scrollTop + e.deltaY, behavior: 'smooth' })
}
</script>

<template>
  <a-layout class="w-full h-full overflow-hidden">
    <a-layout-header class="h-12 px-14">
      <a-menu
        class="h-12 leading-[48px]"
        v-model:selectedKeys="selKeys"
        theme="dark"
        mode="horizontal"
      >
        <a-menu-item key="home">
          <template #icon><DashboardOutlined /></template>
          主页
        </a-menu-item>
        <a-menu-item key="jobs">
          <template #icon><ScheduleOutlined /></template>
          任务列表
        </a-menu-item>
        <a-menu-item key="define">
          <template #icon><FieldTimeOutlined /></template>
          新增任务
        </a-menu-item>
      </a-menu>
    </a-layout-header>
    <a-layout class="relative" @mousemove="onMouseMove" @mouseup="onMouseUp">
      <a-layout-sider v-if="sideBar.showLeft" :width="300" theme="light">
        <div class="h-full flex flex-col">
          <div class="flex-1 relative">
            <a-tree
              class="px-4 pt-4 overflow-auto absolute top-0 bottom-0 left-0 right-0"
              :show-line="true"
              :show-icon="false"
              :tree-data="wvMask.treeData"
            />
          </div>
          <a-divider v-if="wvMask.selEle" class="my-4" />
          <a-descriptions
            v-if="wvMask.selEle"
            class="px-4 pb-4"
            :column="1"
            :title="'类名：' + wvMask.selEle.clazz"
          >
            <template #extra>
              <a-button type="link" danger @click="onEleClrSel">
                <template #icon><CloseOutlined /></template>
              </a-button>
            </template>
            <a-descriptions-item label="xpath">{{ wvMask.selEle.xpath }}</a-descriptions-item>
            <a-descriptions-item label="外框">{{ wvMask.selEle.rectBox }}</a-descriptions-item>
          </a-descriptions>
        </div>
      </a-layout-sider>
      <a-button
        class="absolute top-5 h-fit border-l-0 rounded-s-none"
        :style="{ left: sideBar.showLeft ? '300px' : '0' }"
        size="small"
        @click="() => swchBoolProp(sideBar, 'showLeft')"
      >
        元
        <br />
        素
        <br />
        <DoubleLeftOutlined v-if="sideBar.showLeft" />
        <DoubleRightOutlined v-else />
      </a-button>
      <a-layout-content class="p-4 ml-5 flex flex-col">
        <a-input-group class="flex mb-3" compact>
          <a-input
            class="flex-1"
            v-model:value="urlForm.url"
            placeholder="http://127.0.0.1"
            allowClear
          />
          <a-button type="primary" @click="() => (curURL = urlForm.url)">跳转</a-button>
        </a-input-group>
        <div v-if="curURL" class="flex-1 relative">
          <div
            ref="webViewCtnr"
            class="overflow-auto absolute left-0 top-0 bottom-0 right-0"
            @scroll="onMainLytScroll"
          >
            <iframe
              ref="webView"
              class="border-none overflow-hidden"
              :src="curURL"
              :width="sideBar.formState.widHgt[0]"
              :height="sideBar.formState.widHgt[1]"
              scrolling="no"
              @load="onWebviewLoaded"
            />
          </div>
          <a-dropdown v-if="sideBar.formState.mode === 'select'" :trigger="['contextmenu']">
            <div class="absolute top-0 left-0 bottom-4 right-4" @wheel="onMaskScroll">
              <svg class="w-full h-full" @mousemove="onMosMovOnWebview">
                <EleRect
                  v-if="wvMask.selEle"
                  :offset="[wvMask.left, wvMask.top]"
                  :element="wvMask.selEle"
                  :stk-wid="2"
                  :selable="false"
                />
                <EleRect
                  v-else-if="wvMask.hovEle"
                  :offset="[wvMask.left, wvMask.top]"
                  :element="wvMask.hovEle"
                  @ele-select="onEleSelect"
                />
              </svg>
              <template v-if="sideBar.formState.showEleId !== 'none'">
                <EleTag
                  v-if="wvMask.selEle"
                  :offset="[wvMask.left, wvMask.top]"
                  :element="wvMask.selEle"
                  :ele-id="sideBar.formState.showEleId"
                  @ele-cancel="onEleClrSel"
                />
                <EleTag
                  v-else-if="wvMask.hovEle"
                  :offset="[wvMask.left, wvMask.top]"
                  :element="wvMask.hovEle"
                  :ele-id="sideBar.formState.showEleId"
                  :closable="false"
                  @ele-select="onEleSelect"
                />
              </template>
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item key="select">检查</a-menu-item>
                <a-menu-item key="clear" @click="onEleClrSel">清空选择</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
        <div v-else class="flex-1 flex items-center justify-center">
          <a-empty description="请输入网页链接并跳转后选择要爬取的内容">
            <template #image>
              <DisconnectOutlined class="text-8xl" />
            </template>
          </a-empty>
        </div>
      </a-layout-content>
      <FlexDivider
        orientation="vertical"
        v-model:wid-hgt="sideBar.width"
        :emitter="sideBar.widEmitter"
      />
      <a-layout-sider class="p-4" :width="sideBar.width" theme="light">
        <FormGroup
          :lblWid="7"
          :mapper="sideBar.mapper"
          :form="sideBar.formState"
          @update:fprop="onSbFormUpdate"
        >
          <template #widHgt>
            <a-input-group>
              <a-row :gutter="4">
                <a-col :span="11">
                  <a-input
                    class="w-full"
                    type="number"
                    :value="sideBar.formState.widHgt[0]"
                    @blur="(e: any) => onWidHgtChange(e, 0)"
                  >
                    <template #suffix>px</template>
                  </a-input>
                </a-col>
                <a-col :span="2" class="text-center"><CloseOutlined /></a-col>
                <a-col :span="11">
                  <a-input
                    class="w-full"
                    type="number"
                    :value="sideBar.formState.widHgt[1]"
                    @blur="(e: any) => onWidHgtChange(e, 1)"
                  >
                    <template #suffix>px</template>
                  </a-input>
                </a-col>
              </a-row>
            </a-input-group>
          </template>
        </FormGroup>
      </a-layout-sider>
    </a-layout>
  </a-layout>
</template>
