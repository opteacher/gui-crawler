import Node from '@lib/types/node'
import { getProp, gnlCpy } from '@lib/utils'
import Task from './task'
import BinMap from './binMap'
import PageEle from '@lib/types/pageEle'
import PgOper from '@lib/types/pgOper'
import { Cond } from '@lib/types'

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
  binMaps: BinMap[]

  constructor() {
    this.colcCtnr = new PageEle()
    this.colcItem = new PageEle()
    this.binMaps = []
  }

  reset() {
    this.colcCtnr.reset()
    this.colcItem.reset()
    this.binMaps = []
  }

  static copy(src: any, tgt?: CollectExtra, force = false) {
    return gnlCpy(CollectExtra, src, tgt, {
      force,
      cpyMapper: { colcCtnr: PageEle.copy, colcItem: PageEle.copy, binMaps: BinMap.copy }
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
    copy: GotoExtra.copy
  },
  collect: {
    label: '元素采集',
    color: '#faad14',
    icon: 'HighlightOutlined',
    copy: CollectExtra.copy
  },
  opera: {
    label: '页面操作',
    color: '#52c41a',
    icon: 'SelectOutlined',
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
      placeholder: '将跳转到页面选择元素',
      fullWid: true,
      disabled: [Cond.create('key', '==', '')]
    },
    colcItem: {
      type: 'Button',
      inner: '选择元素',
      label: '采集项',
      placeholder: '将跳转到页面选择元素',
      fullWid: true,
      disabled: [Cond.create('key', '==', '')]
    },
    binMaps: {
      type: 'Button',
      inner: '添加采集项',
      label: '采集表',
      placeholder: '将跳转到页面选择元素',
      fullWid: true,
      disabled: [Cond.create('key', '==', '')]
    }
  }),
  opera: () => ({})
}
