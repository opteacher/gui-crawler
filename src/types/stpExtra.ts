import BinMap from './binMap'
import PageEle from '@lib/types/pageEle'
import PgOper from '@lib/types/pgOper'
import PropVar from './propVar'
import { gnlCpy } from '@lib/utils'

export class GotoExtra {
  chromePath: string
  url: string
  newPage: boolean

  constructor() {
    this.chromePath = ''
    this.url = ''
    this.newPage = false
  }

  reset() {
    this.chromePath = ''
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

export const ctrlTypes = {
  switch: { label: '条件' },
  for: { label: '循环' }
}

export class ControlExtra {
  ctype: keyof typeof ctrlTypes
  param: PropVar

  constructor() {
    this.ctype = 'switch'
    this.param = new PropVar()
  }

  reset() {
    this.ctype = 'switch'
    this.param.reset()
  }

  static copy(src: any, tgt?: ControlExtra, force = false) {
    return gnlCpy(ControlExtra, src, tgt, { force, cpyMapper: { param: PropVar.copy } })
  }
}

export class CondExtra {
  value: PropVar

  constructor() {
    this.value = new PropVar()
  }

  reset() {
    this.value.reset()
  }

  static copy(src: any, tgt?: CondExtra, force = false) {
    return gnlCpy(CondExtra, src, tgt, { force, cpyMapper: { value: PropVar.copy } })
  }
}

export const stypes = {
  unknown: {
    label: '未知类型',
    color: '#ff4d4f',
    icon: 'QuestionOutlined',
    title: '未知类型节点',
    copy: () => null
  },
  goto: {
    label: '页面跳转',
    color: '#1677ff',
    icon: 'SendOutlined',
    title: '跳转到：[url]',
    copy: GotoExtra.copy
  },
  collect: {
    label: '元素采集',
    color: '#faad14',
    icon: 'BlockOutlined',
    title: '从页面中采集元素绑定元对象',
    copy: CollectExtra.copy
  },
  opera: {
    label: '页面操作',
    color: '#52c41a',
    icon: 'FormOutlined',
    title: '在页面中操作',
    copy: OperaExtra.copy
  },
  end: {
    label: '结束节点',
    color: 'rgba(0, 0, 0, 0.45)',
    icon: 'StopOutlined',
    title: '流程结束',
    copy: () => null
  },
  control: {
    label: '控制节点',
    color: '#cb4cfa',
    icon: 'ControlOutlined',
    title: '控制流程走向',
    copy: ControlExtra.copy
  },
  condition: {
    label: '条件节点',
    color: '#33b8b1ff',
    icon: 'ApartmentOutlined',
    title: '与控制节点参数做比较',
    copy: CondExtra.copy
  }
}

export type Stype = keyof typeof stypes