import Node from '@lib/types/node'
import { gnlCpy } from '@lib/utils'
import Task from './task'
import * as antdIcon from '@ant-design/icons-vue'
import ColcItem from './colcItem'
import PageEle from '@lib/types/pageEle'

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
