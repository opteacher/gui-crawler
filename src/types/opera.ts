import PageEle from '@lib/types/pageEle'
import { gnlCpy } from '@lib/utils'

export default class Opera {
  key: string
  element?: PageEle
  otype: 'none' | 'click' | 'input' | 'select' | 'scroll'
  value: any

  constructor() {
    this.key = ''
    this.otype = 'none'
  }

  reset() {
    this.key = ''
    this.element = undefined
    this.otype = 'none'
    this.value = undefined
  }

  static copy(src: any, tgt?: Opera, force = false) {
    return gnlCpy(Opera, src, tgt, { force, cpyMapper: { element: PageEle.copy } })
  }
}
