import Node from '@lib/types/node'
import { getProp, gnlCpy } from '@lib/utils'
import Task from './task'
import BinMap from './binMap'
import PageEle from '@lib/types/pageEle'
import PgOper from '@lib/types/pgOper'
import { PlayCircleOutlined } from '@ant-design/icons-vue'
import { notification } from 'ant-design-vue'
import router from '@/router'
import { createVNode } from 'vue'

export class GotoExtra {
  chromePath: string
  url: string
  newPage: boolean

  constructor() {
    this.chromePath = ''
    this.url = ''
    this.newPage = false
  }

  reset() {
    this.chromePath = ''
    this.url = ''
    this.newPage = false
  }

  static copy(src: any, tgt?: GotoExtra, force = false) {
    return gnlCpy(GotoExtra, src, tgt, { force })
  }
}

export class CollectExtra {
  container: PageEle
  item: PageEle
  binMaps: BinMap[]
  strategy: 'first' | 'all'

  constructor() {
    this.container = new PageEle()
    this.item = new PageEle()
    this.binMaps = []
    this.strategy = 'all'
  }

  reset() {
    this.container.reset()
    this.item.reset()
    this.binMaps = []
    this.strategy = 'all'
  }

  static copy(src: any, tgt?: CollectExtra, force = false) {
    return gnlCpy(CollectExtra, src, tgt, {
      force,
      cpyMapper: { container: PageEle.copy, item: PageEle.copy, binMaps: BinMap.copy }
    })
  }
}

export const stypes = {
  unknown: {
    label: '未知类型',
    color: '#ff4d4f',
    icon: 'QuestionOutlined',
    title: '未知类型节点',
    copy: () => null
  },
  goto: {
    label: '页面跳转',
    color: '#1677ff',
    icon: 'SendOutlined',
    title: '跳转到：[url]',
    copy: GotoExtra.copy
  },
  collect: {
    label: '元素采集',
    color: '#faad14',
    icon: 'BlockOutlined',
    title: '从页面中采集元素绑定元对象',
    copy: CollectExtra.copy
  },
  opera: {
    label: '页面操作',
    color: '#52c41a',
    icon: 'FormOutlined',
    title: '在页面中操作',
    copy: PgOper.copy
  },
  end: {
    label: '结束节点',
    color: 'rgba(0, 0, 0, 0.45)',
    icon: 'StopOutlined',
    title: '流程结束',
    copy: () => null
  }
}

export type Stype = keyof typeof stypes

export function onExecToStepClick(step: Step) {
  const tskKey = router.currentRoute.value.params.tid as string
  const stpKey = step.key || step.previous[0]
  if (!stpKey) {
    notification.error({ message: '无法跳转到该步骤！' })
    return
  }
  router.push(`/gui-crawler/task/${tskKey}/step/${stpKey}/edit`)
}

export default class Step extends Node {
  stype?: Stype
  relative: string
  extra: any
  fkTask: string | Task
  execable: boolean

  constructor() {
    super()
    this.relative = ''
    this.extra = null
    this.fkTask = ''
    this.execable = true
  }

  reset() {
    super.reset()
    this.stype = undefined
    this.relative = ''
    this.extra = null
    this.fkTask = ''
    this.execable = true
  }

  static copy(src: any, tgt?: Step, force = false) {
    tgt = gnlCpy(Step, src, tgt, {
      force,
      baseCpy: Node.copy,
      cpyMapper: { fkTask: Task.copy, extra: getProp(stypes, `${src.stype}.copy`) }
    })
    tgt.color = getProp(stypes, `${tgt.stype}.color`)
    tgt.icon = getProp(stypes, `${tgt.stype}.icon`)
    tgt.extMnuItms = tgt.execable
      ? [
          {
            key: 'preview',
            icon: createVNode(PlayCircleOutlined),
            title: '执行到该步骤',
            onClick: onExecToStepClick
          }
        ]
      : []
    return tgt
  }
}
