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
await Promise.all([page.goto('https://data.eastmoney.com/stock/tradedetail.html'), page.waitForNavigation()])


const ele = await page.waitForSelector('//*[@id="dataview"]/div[2]/div[2]/table[1]/thead[1]/tr[1]/th[8]/div[1]')
await ele.click()