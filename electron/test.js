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
page.on('popup', async newPage => {
  await page.goto(newPage.url())
  await newPage.close()
})
await Promise.all([page.goto('https://www.jiuyangongshe.com/'), page.waitForNavigation()])


let container = await page.$(step.extra.container[step.extra.container.idType])
if (!container) {
  throw new Error('未找到采集容器！')
}
let items = await container.$$(step.extra.item[step.extra.item.idType])
if (!items || !items.length) {
  throw new Error('未找到一篇文章！')
}
const orgIdx = await page.evaluate('navigation.entries().find(entry => entry.sameDocument).index')
console.log(orgIdx)
const title = await items[0].$('.book-title.asdasd.click.fs17-bold')
await Promise.all([
  title.click(),
  page.waitForNavigation()
])
console.log('加载完毕')
const stock = await page.$('.h_source')
console.log(await stock.getProperty('outerHTML').then(txt => txt.jsonValue()))
await Promise.all([
  stock.click(),
  page.waitForNavigation()
])
const curIdx = await page.evaluate('navigation.entries().find(entry => entry.sameDocument).index')
console.log(curIdx)
await new Promise(resolve => setTimeout(resolve, 5000))

for (let i = 0; i < curIdx - orgIdx; ++i) {
  await Promise.all([page.goBack({ waitUntil: 'domcontentloaded' }), page.waitForNavigation()])
}
container = await page.$(step.extra.container[step.extra.container.idType])
items = await container.$$(step.extra.item[step.extra.item.idType])
console.log(await items[1]
  .$('.book-title.asdasd.click.fs17-bold')
  .then(ele => ele.getProperty('textContent'))
  .then(txt => txt.jsonValue())
)