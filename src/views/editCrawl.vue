<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  RightOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons-vue'
import { TinyEmitter } from 'tiny-emitter'
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper from '@lib/types/mapper'
import { setProp, swchBoolProp } from '@lib/utils'
import _ from 'lodash'
import PageEle from '@/types/pageEle'
import { Cond } from '@lib/types'
import Schema from '@/types/schema'
import EleSelWarp from '@/components/eleSelWrap.vue'
import { WebviewTag } from 'electron'
import PgEleSelect from '@lib/components/PgEleSelect.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const webView = ref<WebviewTag | null>(null)
const urlForm = reactive({
  url: 'https://www.jiuyangongshe.com/',
  selKeys: []
})
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
  leftWid: 300,
  leftVsb: true,
  lftEmitter: new TinyEmitter(),
  rightWid: 400,
  rightVsb: true,
  rgtEmitter: new TinyEmitter(),
  mapper: new Mapper({
    pageSettings: {
      type: 'FormGroup',
      label: '页面配置',
      fold: true,
      items: new Mapper({
        structure: {
          type: 'Text',
          label: '包含结构'
        },
        listCtnr: {
          type: 'Unknown',
          label: '列表容器',
          onClick: () => (sideBar.formState.idenEle = 'listCtnr')
        },
        listItem: {
          type: 'Unknown',
          label: '列表元素',
          onClick: () => (sideBar.formState.idenEle = 'listItem')
        },
        itemLink: {
          type: 'Unknown',
          label: '元素链接',
          onClick: () => (sideBar.formState.idenEle = 'itemLink')
        },
        saveBtn: {
          type: 'Button',
          inner: '跳转到详情页',
          display: [
            Cond.create('listCtnr', '!=', null),
            Cond.create('listItem', '!=', null),
            Cond.create('itemLink', '!=', null)
          ],
          onClick: () =>
            webView.value?.executeJavaScript(
              `document.querySelector(".${[
                sideBar.formState.listCtnr?.clazz.replace(/\s+/g, '.'),
                sideBar.formState.listItem?.clazz.replace(/\s+/g, '.'),
                sideBar.formState.itemLink?.clazz.replace(/\s+/g, '.')
              ].join(' .')}").click()`
            )
        }
      })
    },
    colcEles: {
      type: 'FormGroup',
      label: '采集元素',
      fold: true,
      items: new Mapper({
        addSchema: {
          type: 'Button',
          label: '',
          inner: '添加模板',
          offset: 7,
          onClick: () => {
            swchBoolProp(sideBar.formState, 'addSchema')
            swchBoolProp(sideBar.mapper, 'colcEles.items.addSchema.ghost')
          }
        },
        schemas: {
          type: 'Unknown',
          label: '元素模板'
          // display: [Cond.create('schemas.length', '!=', 0)]
        },
        addProp: {
          type: 'Button',
          inner: '添加字段',
          display: [Cond.create('addSchema', '=', true)],
          onClick: () => {
            swchBoolProp(sideBar.formState, 'addProp')
            swchBoolProp(sideBar.mapper, 'colcEles.items.addProp.ghost')
            swchBoolProp(sideBar.mapper, 'colcEles.items.addProp.primary')
            if (sideBar.mapper.colcEles.items.addProp.inner === '添加字段') {
              setProp(sideBar.mapper, 'colcEles.items.addProp.inner', '取消字段')
            } else {
              setProp(sideBar.mapper, 'colcEles.items.addProp.inner', '添加字段')
            }
          }
        },
        bindEle: {
          type: 'Button',
          label: '绑定元素',
          display: [Cond.create('addProp', '=', true)]
        },
        propName: {
          type: 'Input',
          label: '字段名',
          display: [Cond.create('addProp', '=', true)]
        },
        colcType: {
          type: 'Select',
          label: '提取方式',
          options: [
            { label: '文本', value: 'text' },
            { label: '文件', value: 'file' }
          ],
          display: [Cond.create('addProp', '=', true)]
        },
        sbtBtn: {
          type: 'Button',
          inner: '提交',
          ghost: false,
          display: [Cond.create('addProp', '=', true)],
          onClick: onAddPropSbt
        }
      })
    }
  }),
  formState: {
    addSchema: false,
    idenEle: '' as '' | 'listCtnr' | 'listItem' | 'itemLink' | 'bindEle',
    listCtnr: PageEle.copy({ clazz: 'community-bar' }) as PageEle | null,
    listItem: null as PageEle | null,
    itemLink: null as PageEle | null,
    pgStgsChg: false,
    addProp: false,
    schemas: [] as Schema[],
    bindEle: null as PageEle | null,
    propName: '',
    colcType: 'text' as 'text' | 'file'
  }
})

onMounted(() => {
  // webView.value?.addEventListener('dom-ready', () => {
  //   webView.value?.openDevTools()
  // })
})

function onSbFormUpdate(fm: any) {
  Object.entries(fm).map(([k, v]) => setProp(sideBar.formState, k, v))
}
function onMouseMove(e: MouseEvent) {
  sideBar.lftEmitter.emit('mousemove', e)
  sideBar.rgtEmitter.emit('mousemove', e)
}
function onMouseUp() {
  sideBar.lftEmitter.emit('mouseup')
  sideBar.rgtEmitter.emit('mouseup')
}
function onEleSelect(ele?: PageEle) {
  wvMask.selEle = ele || wvMask.hovEle
  wvMask.hovEle = null
  if (sideBar.formState.idenEle) {
    sideBar.formState[sideBar.formState.idenEle] = wvMask.selEle
  } else {
    sideBar.formState.idenEle = ''
  }
}
function onEleClrSel() {
  wvMask.selEle = null
  sideBar.formState.idenEle = ''
}
function onAddPropSbt() {
  sideBar.formState.schemas.push(
    Schema.copy({
      clazz: sideBar.formState.bindEle?.clazz,
      prop: sideBar.formState.propName,
      type: sideBar.formState.colcType
    })
  )
  sideBar.formState.bindEle = null
  sideBar.formState.propName = ''
  sideBar.formState.colcType = 'text'
}
</script>

<template>
  <a-layout class="w-full h-full overflow-hidden" @mousemove="onMouseMove" @mouseup="onMouseUp">
    <a-layout-header class="bg-white inline-flex items-center space-x-3">
      <a-button type="text" @click="() => router.back()">
        <template #icon><ArrowLeftOutlined /></template>
        返回任务列表
      </a-button>
      <a-input-group class="flex-1" size="large" compact>
        <a-input v-model:value="urlForm.url" size="large" style="width: calc(100% - 200px)">
          <template #prefix><RightOutlined /></template>
        </a-input>
        <a-button type="primary">跳转</a-button>
      </a-input-group>
    </a-layout-header>
    <a-layout-content class="flex">
      <PgEleSelect
        :curURL="urlForm.url"
        v-model:selKeys="urlForm.selKeys"
        :sbar-wid="500"
      >
        <template #sideBottom>
          <div class="flex-1 relative">
            <FormGroup
              class="absolute top-0 left-0 right-0 bottom-0 overflow-auto px-3"
              :lblWid="7"
              :mapper="sideBar.mapper"
              :form="sideBar.formState"
              @update:fprop="onSbFormUpdate"
            >
              <template #structure>
                容器
                <RightOutlined />
                元素
                <RightOutlined />
                链接
              </template>
              <template #listCtnr>
                <EleSelWarp
                  pname="listCtnr"
                  :form="sideBar.formState"
                  @ele-select="onEleSelect"
                  @ele-clear="onEleClrSel"
                />
              </template>
              <template #listItem>
                <EleSelWarp
                  pname="listItem"
                  :form="sideBar.formState"
                  @ele-select="onEleSelect"
                  @ele-clear="onEleClrSel"
                />
              </template>
              <template #itemLink>
                <EleSelWarp
                  pname="itemLink"
                  :form="sideBar.formState"
                  @ele-select="onEleSelect"
                  @ele-clear="onEleClrSel"
                />
              </template>
              <template #bindEle>
                <EleSelWarp
                  pname="bindEle"
                  :form="sideBar.formState"
                  @ele-select="onEleSelect"
                  @ele-clear="onEleClrSel"
                />
              </template>
              <template #schemas>
                <a-list size="small" bordered :data-source="sideBar.formState.schemas">
                  <template #renderItem="{ item }">
                    <a-list-item>{{ item }}</a-list-item>
                  </template>
                </a-list>
                <a-card>
                  <a-card-grid class="w-1/2 text-center">Content</a-card-grid>
                </a-card>
              </template>
            </FormGroup>
          </div>
        </template>
      </PgEleSelect>
    </a-layout-content>
  </a-layout>
</template>
