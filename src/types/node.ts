import { gnlCpy } from '@lib/utils'

export default class Node {
  key: string
  prevs: (string | Node)[]
  nexts: (string | Node)[]

  constructor() {
    this.key = ''
    this.prevs = []
    this.nexts = []
  }

  reset() {
    this.key = ''
    this.prevs = []
    this.nexts = []
  }

  static copy(src: any, tgt?: Node, force = false) {
    return gnlCpy(Node, src, tgt, { force, cpyMapper: { prevs: Node.copy, nexts: Node.copy } })
  }
}
