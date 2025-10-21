import Node from '@lib/types/node'
import { getProp, gnlCpy, newOne } from '@lib/utils'
import Task from './task'
import * as antdIcon from '@ant-design/icons-vue'
import ColcItem, { ctypes } from './colcItem'
import PageEle from '@lib/types/pageEle'
import Mapper from '@lib/types/mapper'
import Column from '@lib/types/column'
import PgOper from '@lib/types/pgOper'

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
    this.colcCtnr.reset()
    this.colcItem.reset()
    this.colcEles = []
  }

  static copy(src: any, tgt?: CollectExtra, force = false) {
    return gnlCpy(CollectExtra, src, tgt, {
      force,
      cpyMapper: { colcCtnr: PageEle.copy, colcItem: PageEle.copy, colcEles: ColcItem.copy }
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

export default class Step extends Node {
  stype: keyof typeof stypes
  extra: any
  fkTask: string | Task

  constructor() {
    super()
    this.stype = 'goto'
    this.extra = new GotoExtra()
    this.fkTask = ''
  }

  reset() {
    super.reset()
    this.stype = 'goto'
    if (this.extra.reset) {
      this.extra.reset()
    } else {
      this.extra = {}
    }
    this.fkTask = ''
  }

  static copy(src: any, tgt?: Step, force = false) {
    tgt = gnlCpy(Step, src, tgt, {
      force,
      baseCpy: Node.copy,
      cpyMapper: { fkTask: Task.copy, extra: getProp(stypes, `${src.stype}.copy`) }
    })
    tgt.color = stypes[tgt.stype].color
    tgt.icon = stypes[tgt.stype].icon as keyof typeof antdIcon
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
      placeholder: '将跳转到页面选择元素'
    },
    colcItem: {
      type: 'Button',
      inner: '选择元素',
      label: '采集项',
      placeholder: '将跳转到页面选择元素'
    },
    colcEles: {
      type: 'EditList',
      label: '采集表',
      inline: false,
      mapper: new Mapper({
        element: {
          type: 'Input',
          label: '页面元素'
        },
        ctype: {
          type: 'Select',
          label: '提取内容',
          options: Object.entries(ctypes).map(([value, label]) => ({ label, value }))
        },
        fkMetaobj: {
          type: 'Select',
          label: '元对象'
        },
        proper: {
          type: 'Select',
          label: '对应字段'
        }
      }),
      newFun: () => newOne(ColcItem)
    }
  }),
  opera: () => ({})
}
