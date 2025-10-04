import { BaseTypes } from '@lib/types'
import { gnlCpy } from '@lib/utils'

export class Mprop {
  key: string
  name: string
  ptype: BaseTypes

  constructor() {
    this.key = ''
    this.name = ''
    this.ptype = 'String'
  }

  reset() {
    this.key = ''
    this.name = ''
    this.ptype = 'String'
  }

  static copy(src: any, tgt?: Mprop, force = false) {
    return gnlCpy(Mprop, src, tgt, { force })
  }
}

export default class Meta {
  key: string
  name: string
  props: Mprop[]

  constructor() {
    this.key = ''
    this.name = ''
    this.props = []
  }

  reset() {
    this.key = ''
    this.name = ''
    this.props = []
  }

  static copy(src: any, tgt?: Meta, force = false) {
    return gnlCpy(Meta, src, tgt, { force, cpyMapper: { props: Mprop.copy } })
  }
}
