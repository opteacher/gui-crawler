import { BaseTypes } from "@lib/types"
import { gnlCpy } from "@lib/utils"

export default class PropVar {
  name: string
  typo: BaseTypes
  value: any

  constructor() {
    this.name = ''
    this.typo = 'Unknown'
  }

  reset() {
    this.name = ''
    this.typo = 'Unknown'
    this.value = undefined
  }

  static copy(src: any, tgt?: PropVar, force = false) {
    return gnlCpy(PropVar, src, tgt, { force })
  }
}