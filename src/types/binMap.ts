import PageEle from '@lib/types/pageEle'
import { gnlCpy } from '@lib/utils'

export const ctypes = {
  text: { label: '文本', color: 'blue' },
  file: { label: '文件', color: 'cyan' },
  picture: { label: '图片', color: 'purple' }
}

export default class BinMap {
  key: string
  element: PageEle
  ctype: keyof typeof ctypes
  metaObj?: string
  proper?: string
  desc: string

  constructor() {
    this.key = ''
    this.element = new PageEle()
    this.ctype = 'text'
    this.desc = ''
  }

  reset() {
    this.key = ''
    this.element.reset()
    this.ctype = 'text'
    this.metaObj = undefined
    this.proper = undefined
    this.desc = ''
  }

  static copy(src: any, tgt?: BinMap, force = false) {
    return gnlCpy(BinMap, src, tgt, {
      force,
      cpyMapper: { element: PageEle.copy }
    })
  }
}
