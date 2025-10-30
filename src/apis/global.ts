import { reqGet } from '@lib/utils'

export default {
  chrome: {
    path: () => reqGet('global', 'chromePath', { type: 'api' })
  }
}
