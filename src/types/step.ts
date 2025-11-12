import Node, { NdIntf } from '@lib/types/node'
import { getProp, gnlCpy } from '@lib/utils'
import Task from './task'
import { PlayCircleOutlined } from '@ant-design/icons-vue'
import { notification } from 'ant-design-vue'
import router from '@/router'
import { createVNode } from 'vue'
import { Stype, stypes } from './stpExtra'

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

export function getAvaVars(step: Step, stpDict: Record<string, Step>): NdIntf[] {
  let intfs = step.intfs.filter(intf => intf.niType === 'output')
  for (const pvsKey of step.previous) {
    intfs = intfs.concat(getAvaVars(stpDict[pvsKey], stpDict))
  }
  return intfs
}
