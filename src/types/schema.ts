import { gnlCpy } from "@lib/utils"

export default class Schema {
  clazz: string
  prop: string
  type: 'text' | 'file'

  constructor() {
    this.clazz = ''
    this.prop = ''
    this.type = 'text'
  }

  reset() {
    this.clazz = ''
    this.prop = ''
    this.type = 'text'
  }

  static copy(src: any, tgt?: Schema): Schema {
    return gnlCpy(Schema, src, tgt)
  }
}