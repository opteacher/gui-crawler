import { BaseTypes } from '@lib/types'
import { gnlCpy } from '@lib/utils'

export class Mprop {
  key: string
  name: string
  desc: string
  ptype: BaseTypes

  constructor() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.ptype = 'String'
  }

  reset() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.ptype = 'String'
  }

  static copy(src: any, tgt?: Mprop, force = false) {
    return gnlCpy(Mprop, src, tgt, { force })
  }
}

export default class MetaObj {
  key: string
  name: string
  label: string
  desc: string
  propers: Mprop[]

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.desc = ''
    this.propers = []
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.desc = ''
    this.propers = []
  }

  static copy(src: any, tgt?: MetaObj, force = false) {
    return gnlCpy(MetaObj, src, tgt, { force, cpyMapper: { props: Mprop.copy } })
  }
}
