import { gnlCpy } from '@lib/utils'
import MetaObj from './metaObj'
import Task from './task'

export default class Record {
  key: string
  data: any
  fkTask: string | Task
  fkMetaobj: string | MetaObj

  constructor() {
    this.key = ''
    this.fkTask = ''
    this.fkMetaobj = ''
  }

  reset() {
    this.key = ''
    this.data = undefined
    this.fkTask = ''
    this.fkMetaobj = ''
  }

  static copy(src: any, tgt?: Record, force = false) {
    return gnlCpy(Record, src, tgt, {
      force,
      cpyMapper: { fkTask: Task.copy, fkMetaobj: MetaObj.copy }
    })
  }
}
