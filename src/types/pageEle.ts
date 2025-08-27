import { gnlCpy } from "@lib/utils"

export default class PageEle {
  xpath: string
  clazz: string
  tagName: string
  rectBox: DOMRect

  constructor() {
    this.xpath = ''
    this.clazz = ''
    this.tagName = ''
    this.rectBox = new DOMRect()
  }

  reset() {
    this.xpath = ''
    this.clazz = ''
    this.tagName = ''
    this.rectBox = new DOMRect()
  }

  static copy(src: any, tgt?: PageEle, force = false) {
    return gnlCpy(PageEle, src, tgt, { force })
  }
}