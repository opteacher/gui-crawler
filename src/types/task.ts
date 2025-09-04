import { gnlCpy } from '@lib/utils'
import dayjs, { Dayjs, OpUnitType } from 'dayjs'
import Node from './node'

export const units = {
  y: '年',
  M: '月',
  w: '周',
  D: '天',
  h: '小时',
  m: '分钟',
  s: '秒',
  ms: '毫秒'
}

export default class Task {
  key: string
  name: string
  desc: string
  start: Dayjs
  interval: number
  perUnit: OpUnitType
  fkNode: string | Node

  constructor() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.start = dayjs()
    this.interval = 0
    this.perUnit = 's'
    this.fkNode = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.start = dayjs()
    this.interval = 0
    this.perUnit = 's'
    this.fkNode = ''
  }

  static copy(src: any, tgt?: Task, force = false) {
    return gnlCpy(Task, src, tgt, { force, cpyMapper: { fkNode: Node.copy } })
  }
}
