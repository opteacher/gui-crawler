import PageEle from '@lib/types/pageEle'
import MetaObj from './metaObj'
import { gnlCpy } from '@lib/utils'

export const ctypes = {
  text: '文本',
  file: '文件',
  picture: '图片'
}

export default class ColcItem {
  key: string
  element: PageEle
  ctype: keyof typeof ctypes
  fkMetaobj: string | MetaObj
  proper: string

  constructor() {
    this.key = ''
    this.element = new PageEle()
    this.ctype = 'text'
    this.fkMetaobj = ''
    this.proper = ''
  }

  reset() {
    this.key = ''
    this.element.reset()
    this.ctype = 'text'
    this.fkMetaobj = ''
    this.proper = ''
  }

  static copy(src: any, tgt?: ColcItem, force = false) {
    return gnlCpy(ColcItem, src, tgt, {
      force,
      cpyMapper: { element: PageEle.copy, fkMetaobj: MetaObj.copy }
    })
  }
}
