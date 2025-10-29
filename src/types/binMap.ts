import PageEle from '@lib/types/pageEle'
import { gnlCpy } from '@lib/utils'
import MetaObj from './metaObj'
import PgOper from '@lib/types/pgOper'

export const ctypes = {
  text: { label: '文本', color: 'blue' },
  markdown: { label: 'MarkDown', color: 'orange' },
  file: { label: '文件/图片', color: 'cyan' }
}

export default class BinMap {
  key: string
  element: PageEle
  ctype: keyof typeof ctypes
  metaObj?: string | MetaObj
  proper?: string
  desc: string
  required: boolean
  unqProp: boolean // 唯一字段
  preOpers: PgOper[]

  constructor() {
    this.key = ''
    this.element = new PageEle()
    this.ctype = 'text'
    this.desc = ''
    this.required = false
    this.unqProp = false
    this.preOpers = []
  }

  reset() {
    this.key = ''
    this.element.reset()
    this.ctype = 'text'
    this.metaObj = undefined
    this.proper = undefined
    this.desc = ''
    this.required = false
    this.unqProp = false
    this.preOpers = []
  }

  static copy(src: any, tgt?: BinMap, force = false) {
    return gnlCpy(BinMap, src, tgt, {
      force,
      cpyMapper: { element: PageEle.copy, metaObj: MetaObj.copy, preOpers: PgOper.copy }
    })
  }
}
