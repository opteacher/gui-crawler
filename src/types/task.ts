import { gnlCpy } from '@lib/utils'
import dayjs, { Dayjs, OpUnitType } from 'dayjs'
import Meta from './meta'

export const units = {
  years: '年',
  months: '月',
  weeks: '周',
  days: '天',
  hours: '小时',
  minutes: '分钟',
  seconds: '秒'
}

export class Job {
  nextRunAt: Dayjs
  lastRunAt: Dayjs
  lastFinishedAt: Dayjs

  constructor() {
    this.nextRunAt = dayjs(null)
    this.lastRunAt = dayjs(null)
    this.lastFinishedAt = dayjs(null)
  }

  static copy(src: any, tgt?: Job, force = false) {
    return gnlCpy(Job, src, tgt, { force })
  }
}

export default class Task {
  key: string
  name: string
  desc: string
  start: Dayjs
  interval: number
  perUnit: OpUnitType
  job?: Job
  metas: Meta[]

  constructor() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.start = dayjs()
    this.interval = 0
    this.perUnit = 'seconds'
    this.metas = []
  }

  reset() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.start = dayjs()
    this.interval = 0
    this.perUnit = 'seconds'
    this.job = undefined
    this.metas = []
  }

  static copy(src: any, tgt?: Task, force = false) {
    return gnlCpy(Task, src, tgt, { force, cpyMapper: { job: Job.copy, metas: Meta.copy } })
  }
}
