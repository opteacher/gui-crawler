import PageEle from '@lib/types/pageEle'
import MetaObj from './metaObj'
import { gnlCpy } from '@lib/utils'

export const ctypes = {
  text: '文本',
  file: '文件',
  picture: '图片'
}

export default class BinMap {
  key: string
  element: PageEle
  ctype: keyof typeof ctypes
  fkMetaobj?: string | MetaObj
  proper?: string

  constructor() {
    this.key = ''
    this.element = new PageEle()
    this.ctype = 'text'
  }

  reset() {
    this.key = ''
    this.element.reset()
    this.ctype = 'text'
    this.fkMetaobj = undefined
    this.proper = undefined
  }

  static copy(src: any, tgt?: BinMap, force = false) {
    return gnlCpy(BinMap, src, tgt, {
      force,
      cpyMapper: { element: PageEle.copy, fkMetaobj: MetaObj.copy }
    })
  }
}
