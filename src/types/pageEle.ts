import { RectBox } from '@/utils'

export default interface PageEle {
  xpath: string
  clazz: string
  tagName: string
  rectBox: RectBox
}

export function reset(ele: PageEle) {
  ele.xpath = ''
  ele.clazz = ''
  ele.tagName = ''
  ele.rectBox = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }
}