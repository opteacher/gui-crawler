import puppeteer from 'puppeteer-core'
import axios from 'axios'
import fs from 'fs'

const step = JSON.parse(fs.readFileSync('./test.json', 'utf-8'))
let resp = await axios.get(`/gui-crawler/mdl/v1/task/${step.fkTask}`, {
  baseURL: 'http://124.28.221.82:6031'
})
if (resp.status !== 200) {
  throw new Error(resp.statusText + JSON.stringify(resp.data))
}
const result = resp.data.data || {}
const metas = result.fkMetaobjs || []

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: false
})
const page = await browser.newPage()
await Promise.all([page.goto('https://www.jiuyangongshe.com/'), page.waitForNavigation()])


const container = await page.$(step.extra.container[step.extra.container.idType])
if (!container) {
  throw new Error('未找到采集容器！')
}
const items = await container.$$(step.extra.item[step.extra.item.idType])
if (!items || !items.length) {
  throw new Error('未找到一篇文章！')
}
const colcData = Object.fromEntries(metas.map(mo => [mo.name, []]))
for (const item of items) {
  const colcItem = Object.fromEntries(metas.map(mo => [mo.name, {}]))
  for (const binMap of step.extra.binMaps) {
    const ele = await item.$(binMap.element[binMap.element.idType])
    if (!ele) {
      continue
    }
    const binMeta = metas.find(m => m._id === binMap.metaObj)
    const binProp = binMeta.propers.find(p => p.key === binMap.proper)
    switch (binMap.ctype) {
      case 'text':
        colcItem[binMeta.name][binProp.name] = await ele
          .getProperty('textContent')
          .then(txt => txt.jsonValue())
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
