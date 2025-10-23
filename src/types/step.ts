import Node from '@lib/types/node'
import { getProp, gnlCpy } from '@lib/utils'
import Task from './task'
import BinMap from './binMap'
import PageEle from '@lib/types/pageEle'
import PgOper from '@lib/types/pgOper'
import { Cond } from '@lib/types'
import { TinyEmitter } from 'tiny-emitter'

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
  container: PageEle
  item: PageEle
  binMaps: BinMap[]
  strategy: 'first' | 'all'

  constructor() {
    this.container = new PageEle()
    this.item = new PageEle()
    this.binMaps = []
    this.strategy = 'all'
  }

  reset() {
    this.container.reset()
    this.item.reset()
    this.binMaps = []
    this.strategy = 'all'
  }

  static copy(src: any, tgt?: CollectExtra, force = false) {
    return gnlCpy(CollectExtra, src, tgt, {
      force,
      cpyMapper: { container: PageEle.copy, item: PageEle.copy, binMaps: BinMap.copy }
    })
  }
}

export class OperaExtra {
  opers: PgOper[]

  constructor() {
    this.opers = []
  }

  reset() {
    this.opers = []
  }

  static copy(src: any, tgt?: OperaExtra, force = false) {
    return gnlCpy(OperaExtra, src, tgt, { force, cpyMapper: { opers: PgOper.copy } })
  }
}

export const stypes = {
  goto: {
    label: '页面跳转',
    color: '#1677ff',
    icon: 'SendOutlined',
    title: '跳转到：@url$',
    copy: GotoExtra.copy
  },
  collect: {
    label: '元素采集',
    color: '#faad14',
    icon: 'HighlightOutlined',
    title: '从页面中采集元素绑定元对象',
    copy: CollectExtra.copy
  },
  opera: {
    label: '页面操作',
    color: '#52c41a',
    icon: 'SelectOutlined',
    title: '在页面中操作',
    copy: OperaExtra.copy
  }
}

export type Stype = keyof typeof stypes

export default class Step extends Node {
  stype?: Stype
  extra: any
  fkTask: string | Task

  constructor() {
    super()
    this.extra = null
    this.fkTask = ''
  }

  reset() {
    super.reset()
    this.stype = undefined
    this.extra = null
    this.fkTask = ''
  }

  static copy(src: any, tgt?: Step, force = false) {
    tgt = gnlCpy(Step, src, tgt, {
      force,
      baseCpy: Node.copy,
      cpyMapper: { fkTask: Task.copy, extra: getProp(stypes, `${src.stype}.copy`) }
    })
    tgt.color = getProp(stypes, `${tgt.stype}.color`)
    tgt.icon = getProp(stypes, `${tgt.stype}.icon`)
    return tgt
  }
}
