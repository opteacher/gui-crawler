import puppeteer from 'puppeteer-core'
import axios from 'axios'
import step from './test.json'

const browser = await puppeteer.launch({
  executablePath: 'C:\\Users\\shines\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: false
})
const page = await browser.newPage()
await Promise.all([
  page.goto('https://www.jiuyangongshe.com/'),
  page.waitForNavigation()
])

const getEleIden = pgEl => {
  switch (pgEl.idType) {
    case 'idCls':
      return pgEl.idCls.startsWith('.') ? pgEl.idCls.replaceAll(' ', '.') : pgEl.idCls
    case 'xpath':
    case 'tagName':
    default:
      return pgEl[pgEl.idType]
  }
}
const moDict = {}
for (const binMap of step.extra.binMaps) {
  if (!(binMap.metaObj in moDict)) {
    const resp = await axios.get(`/gui-crawler/mdl/v1/metaObj/${binMap.metaObj}`, {
      baseURL: 'http://192.168.1.11:4009'
    })
    if (resp.status !== 200) {
      throw new Error('请求失败！')
    }
    moDict[binMap.metaObj] = resp.data.data
  }
  binMap.metaObj = moDict[binMap.metaObj]
  binMap.proper = binMap.metaObj.propers.find(prop => prop.key === binMap.proper)
}
const container = await page.$(getEleIden(step.extra.container))
if (!container) {
  throw new Error('未找到采集容器！')
}
const items = await container.$$(getEleIden(step.extra.item))
if (!items || !items.length) {
  throw new Error('未找到一篇文章！')
}
const colcData = Object.fromEntries(Object.values(moDict).map(mo => [mo.name, []]))
for (const item of items) {
  const colcItem = Object.fromEntries(Object.values(moDict).map(mo => [mo.name, {}]))
  for (const binMap of step.extra.binMaps) {
    const ele = await item.$(getEleIden(binMap.element))
    switch (binMap.ctype) {
      case 'text':
        colcItem[binMap.metaObj.name][binMap.proper.name] = await ele.getProperty('textContent').then(txt => txt.jsonValue())
        break
      case 'file':
        break
    }
  }
  for (const [key, val] of Object.entries(colcItem)) {
    if (Object.keys(val).length) {
      colcData[key].push(val)
    }
  }
}