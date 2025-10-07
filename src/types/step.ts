import Node from '@lib/types/node'
import { gnlCpy } from '@lib/utils'
import Task from './task'
import * as antdIcon from '@ant-design/icons-vue'
import { Mprop } from './meta'

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
      cpyMapper: { fkTask: Task.copy, colcEles: Mprop.copy }
    })
    tgt.color = stypes[tgt.stype].color
    tgt.icon = stypes[tgt.stype].icon as keyof typeof antdIcon
    return tgt
  }
}
