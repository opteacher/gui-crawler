import { gnlCpy } from '@lib/utils'
import dayjs, { Dayjs, OpUnitType } from 'dayjs'
import Node from './node'

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
