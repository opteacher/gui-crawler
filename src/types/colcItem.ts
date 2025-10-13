import PageEle from '@lib/types/pageEle'
import MetaObj from './metaObj'
import { gnlCpy } from '@lib/utils'

export default class ColcItem {
  key: string
  itemEle: PageEle
  fkMetaobj: string | MetaObj

  constructor() {
    this.key = ''
    this.itemEle = new PageEle()
    this.fkMetaobj = ''
  }

  reset() {
    this.key = ''
    this.itemEle = new PageEle()
    this.fkMetaobj = ''
  }

  static copy(src: any, tgt?: ColcItem, force = false) {
    return gnlCpy(ColcItem, src, tgt, {
      force,
      cpyMapper: { itemEle: PageEle.copy, fkMetaobj: MetaObj.copy }
    })
  }
}
