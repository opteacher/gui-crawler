import { BaseTypes, typeOpns } from '@lib/types'
import Mapper from '@lib/types/mapper'
import { gnlCpy } from '@lib/utils'
import _ from 'lodash'
import { v4 as uuid } from 'uuid'

export class Mprop {
  key: string
  name: string
  label: string
  ptype: BaseTypes

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.ptype = 'String'
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.ptype = 'String'
  }

  static copy(src: any, tgt?: Mprop, force = false) {
    return gnlCpy(Mprop, src, tgt, { force })
  }
}

export default class MetaObj {
  key: string
  name: string
  label: string
  desc: string
  propers: Mprop[]

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.desc = ''
    this.propers = []
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.desc = ''
    this.propers = []
  }

  static copy(src: any, tgt?: MetaObj, force = false) {
    return gnlCpy(MetaObj, src, tgt, { force, cpyMapper: { props: Mprop.copy } })
  }
}

export const metaMapper = {
  name: {
    type: 'Input',
    label: '名称',
    rules: [{ required: true, message: '必须输入名称！' }],
    onBlur: (editing: MetaObj, name: string) => {
      editing.name = _.capitalize(name)
    }
  },
  label: {
    type: 'Input',
    label: '中文名'
  },
  desc: {
    type: 'Textarea',
    label: '描述'
  },
  propers: {
    type: 'EditList',
    label: '字段',
    rules: [{ required: true, message: '必须填入至少一个字段！', type: 'array' }],
    lblProp: 'name',
    inline: false,
    flatItem: false,
    subProp: 'label',
    mapper: new Mapper({
      name: {
        type: 'Input',
        label: '字段名',
        rules: [{ required: true, message: '必须输入字段名！' }]
      },
      label: {
        type: 'Input',
        label: '中文名'
      },
      ptype: {
        type: 'Select',
        label: '类型',
        options: typeOpns,
        rules: [{ required: true, message: '必须选择类型！', trigger: 'change' }]
      }
    }),
    newFun: Mprop.copy,
    onAddSubmit: (newProp: Mprop) => (newProp.key = uuid())
  }
}
