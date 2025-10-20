import Node from '@lib/types/node'
import { gnlCpy, newOne } from '@lib/utils'
import Task from './task'
import * as antdIcon from '@ant-design/icons-vue'
import ColcItem from './colcItem'
import PageEle from '@lib/types/pageEle'
import { Cond, typeOpns } from '@lib/types'
import Mapper from '@lib/types/mapper'
import Column from '@lib/types/column'
import { Mprop } from './metaObj'

export const stypes = {
  goto: { label: '页面跳转', color: '#1677ff', icon: 'SendOutlined' },
  collect: { label: '元素采集', color: '#faad14', icon: 'HighlightOutlined' },
  opera: { label: '页面操作', color: '#52c41a', icon: 'SelectOutlined' }
}

export default class Step extends Node {
  stype: keyof typeof stypes
  extra: any
  fkTask: string | Task

  constructor() {
    super()
    this.stype = 'goto'
    this.extra = {}
    this.fkTask = ''
  }

  reset() {
    super.reset()
    this.stype = 'goto'
    this.extra = {}
    this.fkTask = ''
  }

  static copy(src: any, tgt?: Step, force = false) {
    tgt = gnlCpy(Step, src, tgt, {
      force,
      baseCpy: Node.copy,
      cpyMapper: { fkTask: Task.copy }
    })
    tgt.color = stypes[tgt.stype].color
    tgt.icon = stypes[tgt.stype].icon as keyof typeof antdIcon
    return tgt
  }
}

export class GotoExtra {
  url: string
  newPage: boolean

  constructor() {
    this.url = ''
    this.newPage = false
  }

  reset() {
    this.url = ''
    this.newPage = false
  }

  static copy(src: any, tgt?: GotoExtra, force = false) {
    return gnlCpy(GotoExtra, src, tgt, { force })
  }
}

export class CollectExtra {
  colcCtnr: PageEle
  colcItem: PageEle
  colcEles: ColcItem[]

  constructor() {
    this.colcCtnr = new PageEle()
    this.colcItem = new PageEle()
    this.colcEles = []
  }

  reset() {
    this.colcCtnr = new PageEle()
    this.colcItem = new PageEle()
    this.colcEles = []
  }

  static copy(src: any, tgt?: CollectExtra, force = false) {
    return gnlCpy(CollectExtra, src, tgt, {
      force,
      cpyMapper: { colcCtnr: PageEle.copy, colcItem: PageEle.copy, colcEles: ColcItem.copy }
    })
  }
}

export const mapperDict = {
  goto: () => ({
    url: {
      type: 'Input',
      label: '地址',
      rules: [{ required: true, message: '必须输入网站地址！' }]
    },
    newPage: {
      type: 'Switch',
      label: '新页面打开'
    }
  }),
  collect: () => ({
    colcCtnr: {
      type: 'Button',
      inner: '选择元素',
      label: '采集容器',
      placeholder: '将跳转到页面选择元素'
    },
    colcItem: {
      type: 'Button',
      inner: '选择元素',
      label: '采集项',
      placeholder: '将跳转到页面选择元素'
    },
    colcEles: {
      type: 'Table',
      label: '采集表',
      mapper: new Mapper({
        key: {
          type: 'Input',
          label: '字段名',
          rules: [{ required: true, message: '必须输入字段名！' }]
        },
        name: {
          type: 'Input',
          label: '中文名',
          rules: [{ required: true, message: '必须输入中文名！' }]
        },
        ptype: {
          type: 'Select',
          label: '类型',
          options: typeOpns,
          rules: [{ required: true, message: '必须选择字段类型！', trigger: 'change' }]
        }
      }),
      columns: [
        new Column('字段名', 'key'),
        new Column('中文名', 'name'),
        new Column('类型', 'ptype')
      ],
      newFun: () => newOne(Mprop)
    }
  }),
  opera: () => ({})
}
