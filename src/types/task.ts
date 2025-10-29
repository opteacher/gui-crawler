import { gnlCpy } from '@lib/utils'
import dayjs, { Dayjs, OpUnitType } from 'dayjs'
import MetaObj from './metaObj'
import tskRcd from './record'

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
  code: string
  fkMetaobjs: (string | MetaObj)[]
  rcdDict: Record<string, tskRcd[]>

  constructor() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.start = dayjs()
    this.interval = 0
    this.perUnit = 'seconds'
    this.code = ''
    this.fkMetaobjs = []
    this.rcdDict = {}
  }

  reset() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.start = dayjs()
    this.interval = 0
    this.perUnit = 'seconds'
    this.job = undefined
    this.code = ''
    this.fkMetaobjs = []
    this.rcdDict = {}
  }

  static copy(src: any, tgt?: Task, force = false) {
    tgt = gnlCpy(Task, src, tgt, {
      force,
      ignProps: ['rcdDict'],
      cpyMapper: { job: Job.copy, fkMetaobjs: MetaObj.copy }
    })
    if ((src.rcdDict && Object.keys(src.rcdDict).length) || force) {
      tgt.rcdDict = Object.fromEntries(
        Object.entries(src.rcdDict || {}).map(([key, val]: [string, any]) => [
          key,
          val.map((v: any) => tskRcd.copy(v))
        ])
      )
    }
    return tgt
  }
}
