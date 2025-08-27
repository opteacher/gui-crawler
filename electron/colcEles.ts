import PageEle from '@/types/pageEle'
import { TreeDataItem } from 'ant-design-vue/es/tree'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

export default async function (
  _e: Electron.IpcMainInvokeEvent,
  url: string
): Promise<{ elements: PageEle[]; treeData: TreeDataItem[]; rectBox: DOMRect }> {
  /** 打开页面，配置好全局变量
   * @param {Unknown} ctx
   * @returns {Unknown}
   * @returns {Unknown}
   * @returns {Unknown}
   * @returns {Unknown}
   **/
  const browser = await puppeteer.launch({
    executablePath: path.join(process.env.APP_ROOT, 'chrome-win/chrome.exe'),
    acceptInsecureCerts: true,
    args: [
      "--proxy-server='direct://'",
      '--proxy-bypass-list=*',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--single-process',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--enable-features=NetworkService'
    ]
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(300000)
  // await page.setViewport(JSON.parse(rect))
  const ignTags = ['style', 'script', 'link', 'meta', 'head', 'header', 'title']
  let elements = []

  /** 跳转URL页面
   * @param {Unknown} ctx
   * @param {Unknown} page
   **/
  await Promise.all([
    page.waitForNavigation(),
    page.goto(url, {
      waitUntil: 'networkidle0', // Remove the timeout
      timeout: 0
    })
  ])
  await page.content()

  const rectBox = await page.evaluate(() => DOMRect.fromRect({
    width: document.body.scrollWidth,
    height: document.body.scrollHeight
  }))

  /** 遍历所有元素
   * @param {Any} array 集合
   * @returns {Any} 索引
   **/
  for (const el of await page.$$('*')) {
    /** 执行递归生成元素xpath
     * @param {Unknown} el
     * @param {Unknown} ignTags
     * @param {Unknown} elements
     **/
    elements.push(
      await el.evaluate(function (el: Element, ignTags: string[]) {
        const tagName = el.tagName.toLowerCase()
        const ret = {
          tagName,
          clazz: el.className,
          rectBox: el.getBoundingClientRect().toJSON()
        }
        if (ignTags.includes(tagName)) {
          return
        }
        if (el === document.body) {
          return { xpath: '/html/body', ...ret }
        }
        if (el.id !== '') {
          return { xpath: `//*[@id="${el.id}"]`, id: el.id, ...ret }
        }

        let index = 1
        const siblings =
          el.parentElement && el.parentElement.children ? el.parentElement.children : []
        for (const sibling of siblings) {
          if (sibling === el) {
            // 递归调用，获取父节点的 XPath 路径，然后拼接当前元素的标签名和索引
            const prtEl = arguments.callee(el.parentElement, ignTags)
            return prtEl
              ? {
                  xpath: prtEl.xpath + `/${tagName}[${index}]`,
                  ...ret
                }
              : undefined
          }

          if (sibling.nodeType === 1 && sibling.tagName === el.tagName) {
            index++ // 增加索引值
          }
        }
      }, ignTags)
    )
  }

  /** 生成元素节点树
   * @param {Unknown} elements
   * @returns {Unknown}
   **/
  elements = elements.filter(el => el) as PageEle[]
  let treeData = [] as any[]

  /** 遍历元素，生成节点数
   * @param {Any} array 集合
   * @returns {Any} 索引
   **/
  for (const element of elements) {
    /** 分解xpath以生成节点树
     * @param {Unknown} element
     * @param {Unknown} treeData
     * @returns {Unknown}
     * @returns {Unknown}
     * @returns {Unknown}
     **/
    const xpaths = element.xpath.split('/').filter(sec => sec)
    let subNodes = treeData
    let lastNode = null

    /** 分割xpath
     * @param {Any} array 集合
     * @returns {Any} 索引
     **/
    for (const [idx, xp] of xpaths.entries()) {
      /** 填入树节点
       * @param {Unknown} xp
       * @param {Unknown} idx
       * @param {Unknown} subNodes
       * @param {Unknown} xpaths
       * @param {Unknown} element
       **/
      lastNode = subNodes.find(nd => nd.title === xp)
      if (lastNode) {
        subNodes = lastNode.children || []
      } else {
        const prefix = xpaths[0].startsWith('*') ? '//' : '/'
        lastNode = {
          key: prefix + xpaths.slice(0, idx + 1).join('/'),
          title: xp,
          children: []
        }
        subNodes.push(lastNode)
        subNodes = lastNode.children
      }
    }

    /** 为最后节点添加元素信息
     * @param {Unknown} lastNode
     * @param {Unknown} element
     **/
    lastNode.element = element
  }

  /** 关闭浏览器
   * @param {Unknown} browser
   * @param {Unknown} elements
   * @param {Unknown} treeData
   **/
  await browser.close()
  return {
    elements,
    treeData,
    rectBox
  }
}
