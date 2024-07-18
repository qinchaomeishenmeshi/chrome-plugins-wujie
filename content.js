/**
 * @description: 抖音创作中心自动化脚本，用于自动填写表单并发布视频
 * 同步账号
 * 获取任务
 * 上传视频
 * 发布视频
 * 修改任务状态
 * 退出登录
 * */



// 
const baseURL = 'https://bj.devwwd.site:449/dev-api/videoclip'
// 获取任务task的api
const getTaskApi = '/admin/autopublishtask/getNoPublicData'
// 同步账号的api
const syncAccountApi = '/admin/juzhensubaccount/accountManage'
// 发布成功的api
const updateAutoPublishTaskApi = '/admin/autopublishtask/updateAutoPublishTask'

// DOM 操作延迟时间
const DOM_DELAY = 2000
// 页面加载延迟时间
const PAGE_DELAY = 5000
// 机构号首页
const creatorHomePage = 'https://creator.douyin.com/creator-micro/home'
// 子账号首页
const childCreatorHomePage = 'https://creator.douyin.com/'
// 子账号内容管理页码
const childContentPage = 'https://creator.douyin.com/content/manage'
// 子账号上传页面
const childUploadPage = 'https://creator.douyin.com/content/'
// 子账号发布页面
const childPublishPage = 'https://creator.douyin.com/content/publish?enter_from=publish_page'



// 页面加载完成后执行监听
watchPage()



// 接收来自popup的消息
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log(
    '收到来自 ' +
      (sender.tab ? 'content-script(' + sender.tab.url + ')' : 'popup或者background') +
      ' 的消息：',
    request
  )

  for (const key in request) {
    if (request.hasOwnProperty(key)) {
      const element = request[key]
      localStorage.setItem(key, element)
    }
  }
  sendResponse('我收到你的消息了：' + JSON.stringify(request))
  var action = request['action']
  console.log('操作：action----' + action)

  switch (action) {
    case 'sync': // 同步账号
      getTableAll()
      break
    case 'start': // 开始任务
      localStorage.setItem('taskStatus', '1')
      getTask()
      break
    case 'end': // 结束任务
      localStorage.setItem('taskStatus', '0')
      window.location.reload()
      break
    case 'reload': // 保持登陆
      reloadTable()
      break
    case 'logout': // 退出代运营状态
      childLogout()
      break
    default:
      break
  }
})


// 页面加载完成后执行监听
async function watchPage() {
  await waitForPageLoad()
  console.log('页面加载成功。。。')

  // poiOperation('佳兆业·金域天下三期')
  // return

  const taskStatus = localStorage.getItem('taskStatus')

  if (taskStatus !== '1') {
    console.log('任务状态不为1，不执行操作')
    return
  }
  switch (window.location.href) {
    case creatorHomePage: // 机构号首页
      getTask()
      break
    case childCreatorHomePage: // 子账号首页
      // 重新设置缓存标志位
      localStorage.setItem('isResetCache', '0')
      // 进入子页面先清空历史缓存数据
      await removeStorageKey()
      // 跳转到子账号页面的上传
      toChildUploadPage()
      break
    case childUploadPage: // 子账号上传页面
      //  点击上传按钮
      uploadVideoFn()
      break

    case childContentPage: // 子账号内容管理页面
      // 退出代运营状态
      childLogout()
      break

    case childPublishPage: // 子账号发布页面
      // 点击发布按钮
      publishVideo()
      break

    default:
      break
  }
}



async function publishTimePickerSelect(_dateTime) {
  const task = parseJSON(localStorage.getItem('task'), {})
  const t = _dateTime || task.sendTime
  return new Promise(async (resolve, reject) => {
    // 拆解dateTime
    const [date, time] = t.split(' ')
    console.log(date, 'date')
    // 拆解年月日
    const [year, month, day] = date.split('-')
    console.log(year, month, day, 'year')
    // 拆解时分
    const [hour, minute] = time.split(':')
    console.log(hour, minute, 'hour')

    // 选择发布方式
    await selectPublishType(true)
    await delay(DOM_DELAY)
    // 打开日期选择器
    await selectDateTime()
    await delay(DOM_DELAY)
    // 找到当前日期
    const currentDateTime = await getCurrentDate()
    if (currentDateTime === t) {
      console.log('当前选择为dateTime日期，则匹配时间')
      // 选择时间
      await selectTime(hour, minute)
      await delay(DOM_DELAY)
      resolve(true)
    } else {
      const currentYear = currentDateTime.split('-')[0]
      const currentMonth = currentDateTime.split('-')[1]
      console.log('当前选择不是dateTime日期，判断是否为当前年月')
      if (currentYear === year && currentMonth === month) {
        console.log('年月相同，直接选择日期')
        // 选择日期
        await selectDate(day)
        await delay(DOM_DELAY)
        // // 选择时间
        await selectTime(hour, minute)
        await delay(DOM_DELAY)
        resolve(true)
      } else {
        console.log('年月不同，先选择年月，再选择日期')
        // 选择年月
        await selectYearMonth(year, month)
        await delay(DOM_DELAY)
        // 选择日期
        await selectDate(day)
        await delay(DOM_DELAY)
        // 选择时间
        await selectTime(hour, minute)
        await delay(DOM_DELAY)
        resolve(true)
      }
    }
  })
}

// 选择定时发布或者立即发布
async function selectPublishType(isTiming) {
  console.log(isTiming, 'isTiming')
  // 找到所有label标签
  const labels = await waitForElement('label>span', { isAll: true })

  if (labels && labels.length && isTiming) {
    // 找到innerText为“定时发布”的label标签，点击定时发布
    const label = Array.from(labels).find((item) => item.innerText === '定时发布')
    console.log(label, 'label')
    label.click()
  } else {
    // 立即发布
    const label = Array.from(labels).find((item) => item.innerText === '立即发布')
    console.log(label, 'label')
    label.click()
  }
}

// 选择定时发布后，点击日期选择器
async function selectDateTime() {
  // 打开日期选择器
  const datePickerElement = await waitForElement('.semi-datepicker>.semi-datepicker-input')
  console.log(datePickerElement, '日期选择器')
  datePickerElement.click()
}

// 获取当前日期
async function getCurrentDate() {
  // 找到当前日期
  const currentDate = await waitForElement(
    '.semi-datepicker-day.semi-datepicker-day-today.semi-datepicker-day-selected'
  )
  // 获取属性title的值
  const currentDateTime = currentDate.getAttribute('title')
  console.log(currentDateTime, 'currentDate-title')
  return currentDateTime
}

// 选择年月
async function selectYearMonth(year, month) {
  // 年月选择开始
  const datePickerHeader = await waitForElement('.semi-datepicker-navigation-month>button')
  console.log(datePickerHeader, 'datePickerHeader')
  // 如果不是，则点击
  datePickerHeader.click()
  await delay(DOM_DELAY)
  //  年份列表
  const yearMonthSelect = await waitForElement(
    '.semi-scrolllist-body>.semi-scrolllist-item-wheel',
    { isAll: true }
  )
  const yearList = yearMonthSelect[0].querySelectorAll('li')
  console.log(yearList, 'yearList')
  simulateWheelEvent(yearList, year)
  await delay(DOM_DELAY)
  // 月份列表
  const monthList = yearMonthSelect[1].querySelectorAll('li')
  console.log(monthList, 'monthList')
  simulateWheelEvent(monthList, month)
  await delay(DOM_DELAY)
  // 点击返回日期选择
  const backBtn = await waitForElement('.semi-datepicker-yearmonth-header>button')
  console.log(backBtn, 'backBtn')
  backBtn.click()
  // 年月选择结束
}

// 选择日期
async function selectDate(day) {
  const dateList = await waitForElement('.semi-datepicker-month .semi-datepicker-day', {
    isAll: true
  })
  console.log(dateList, 'dateList')
  const dateElement = dateList[day]
  console.log(dateElement, '日期')
  dateElement.click()
}

// 选择时间
async function selectTime(hour, minute) {
  // 时间选择按钮
  const timePicker = await waitForElement('.semi-datepicker-switch-time')
  console.log(timePicker, 'timePicker')
  timePicker.click()
  await delay(DOM_DELAY)
  // 时间列表
  const selectList = await waitForElement('.semi-scrolllist-body>.semi-scrolllist-item-wheel', {
    isAll: true
  })
  // 获取要触发双击事件的 li 元素
  const hourList = selectList[0].querySelectorAll('li')
  await simulateWheelEvent(hourList, hour)
  await delay(DOM_DELAY)
  const minuteList = selectList[1].querySelectorAll('li')
  await simulateWheelEvent(minuteList, minute)
}

// 滚动到目标位置
async function simulateWheelEvent(list, target, retryCount = 0, maxRetries = 5) {
  return new Promise((resolve, reject) => {
    const targetLi = Array.from(list).find((li) => li.textContent.trim().includes(target))

    if (!targetLi) {
      const error = new Error('未找到目标元素')
      console.error('simulateWheelEvent error:', error)
      reject(error)
      return
    }

    try {
      console.log(target, 'target')
      // 使用 scrollIntoView 方法滚动到目标元素
      targetLi.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 定义一个轮询检查函数
      const checkPosition = () => {
        const rect = targetLi.getBoundingClientRect()
        const isAtPosition = rect.top >= 0 && rect.bottom <= window.innerHeight

        if (isAtPosition) {
          resolve()
        } else {
          if (retryCount < maxRetries) {
            console.log(`Retrying... (${retryCount + 1}/${maxRetries})`)
            simulateWheelEvent(list, target, retryCount + 1, maxRetries)
              .then(resolve)
              .catch(reject)
          } else {
            const error = new Error('Exceeded maximum retries')
            console.error('simulateWheelEvent error:', error)
            reject(error)
          }
        }
      }

      // 开始检查滚动位置
      setTimeout(checkPosition, 500)
    } catch (error) {
      console.error('模拟鼠标滚轮事件的函数error:', error)
      reject(error)
    }
  })
}

// 重新加载table
async function reloadTable() {
  try {
    // 获取最大页码
    await getMaxPage()
    // 如果不是最后一页，轮流跳转到最后一页
    while (currentPage < maxPage) {
      nextPage()
      await delay(PAGE_DELAY)
    }
    // 如果是最后一页，再次获取最大页码
    await getMaxPage()
    // 如果不是第一页，轮流跳转到第一页
    while (currentPage > 1) {
      prevPage()
      await delay(PAGE_DELAY)
    }
    // 如果是第一页，再次获取最大页码
    await getMaxPage()
    // 10秒后重新获取表格数据
    await delay(PAGE_DELAY)
    reloadTable()
  } catch (error) {
    $handleError(error)
  }
}

// 账号列表
const accountList = []
// 创建一个空数组来保存收集到的数据
const dataList = []
// 记录当前页数
let currentPage = 1
// 记录最大页数
let maxPage = 1
// 重试次数
let retryCount = 0
// 最大重试次数
const maxRetryCount = 5

// 同步账号信息
async function syncAccount() {
  const params = [...new Set(dataList)]
  try {
    // 调用接口传递给后台
    const res = await $Request(syncAccountApi, {
      params
    })
    localStorage.setItem('dataList', JSON.stringify(dataList))
    console.log(res, '同步账号接口---res')
  } catch (error) {
    $handleError(error)
  }
}

// 获取当前页面的表格数据
async function getTableAll() {
  try {
    // 获取表格的tbody元素
    const table = document.querySelector('.douyin-creator-pc-table-tbody')
    // 获取所有的tr元素
    const rows = table.querySelectorAll('tr')

    if (rows) {
      // 遍历所有的tr元素
      rows.forEach((row) => {
        // 创建一个空对象来保存每行的数据
        const rowData = {}

        // 获取当前行的所有td元素
        const cells = row.querySelectorAll('td')

        // 获取每个td中的数据，并存储到rowData对象中
        rowData.avatar = cells[0].querySelector('img').src
        rowData.name = cells[0].querySelector('p').textContent.trim()
        rowData.dyAccountNo = cells[1].textContent.trim()
        rowData.date = cells[2].textContent.trim()

        // 将rowData对象添加到dataList数组中
        dataList.push(rowData)
      })

      // /admin/juzhensubaccount/accountManage
      // 打印收集到的数据
      console.log(dataList)

      // 获取最大页码
      await getMaxPage()

      // 递归调用获取下一页数据
      if (currentPage < maxPage) {
        await nextPage()
        await getTableAll()
      } else {
        console.log('所有页面的数据已获取完毕')
        syncAccount()
      }
    } else {
      throw new Error('未找到表格的tbody元素')
    }
  } catch (error) {
    $handleError(error)
    // 重新获取table
    await delay(DOM_DELAY)
    retryCount++

    if (retryCount < maxRetryCount) {
      await getTableAll()
    } else {
      console.error('重试次数已达上限')
    }
  }
}

async function getTable(task) {
  accountList.length = 0
  try {
    // 获取表格的tbody元素
    const table = document.querySelector('.douyin-creator-pc-table-tbody')
    // 获取所有的tr元素
    const rows = table.querySelectorAll('tr')
    // 遍历所有的tr元素
    rows.forEach((row, col) => {
      // 创建一个空对象来保存每行的数据
      const rowData = {}

      // 获取当前行的所有td元素
      const cells = row.querySelectorAll('td')

      // 获取每个td中的数据，并存储到rowData对象中
      rowData.avatar = cells[0].querySelector('img').src
      rowData.name = cells[0].querySelector('p').textContent.trim()
      rowData.dyAccountNo = cells[1].textContent.trim()
      rowData.date = cells[2].textContent.trim()
      rowData.actions = Array.from(cells[4].querySelectorAll('span'))
      rowData.sort = col

      // 将rowData对象添加到dataList数组中
      accountList.push(rowData)
    })

    // 打印收集到的数据
    console.log(accountList, 'accountList')
    if (accountList && accountList.length) {
      // 获取accountList中id为ID的元素
      const childAccount = accountList.find((item) => item.dyAccountNo === task.dyUserId)
      console.log(childAccount, 'childAccount')
      if (childAccount) {
        // 点击子账号的操作按钮
        childAccount.actions[0].click()
      } else {
        messageCreate('未找到子账号，请检查并重新同步账号')
        $handleError('未找到子账号')
        localStorage.setItem('taskStatus', '0')
        reloadPage()
      }
    }
  } catch (error) {
    $handleError(error)
    // 重新获取table
    await delay(DOM_DELAY)
    retryCount++

    if (retryCount < maxRetryCount) {
      getTable()
    }
  }
}

// 获取最大页码数
async function getMaxPage() {
  // 获取分页器的元素
  // 获取分页器的元素
  const pageDiv = await waitForElement(
    '.douyin-creator-pc-page-item.douyin-creator-pc-page-item-small'
  )
  console.log(pageDiv, 'pageDiv')
  if (pageDiv) {
    // 获取div的文本内容
    const pageText = pageDiv.innerText.trim()
    currentPage = Number(pageText.split('/')[0])
    maxPage = Number(pageText.split('/')[1])
    console.log('currentPage', currentPage)
    console.log('maxPage', maxPage)
  } else {
    $handleError('未找到目标div元素')
  }
}

// 点击上一页
async function prevPage() {
  // 如果当前页数不是1，就点击上一页
  if (currentPage > 1) {
    const prevPageButton = document.querySelector(
      '.douyin-creator-pc-page-item.douyin-creator-pc-page-prev'
    )
    if (prevPageButton) {
      prevPageButton.click()
      console.log('prevPageButton clicked')
      await delay(DOM_DELAY) // 等待页面加载完成
      await getMaxPage() // 更新当前页码
    } else {
      $handleError('未找到上一页按钮')
    }
  } else {
    console.log('已经是第一页')
  }
}

// 点击下一页
async function nextPage() {
  if (currentPage < maxPage) {
    const nextPageButton = document.querySelector(
      '.douyin-creator-pc-page-item.douyin-creator-pc-page-next'
    )
    if (nextPageButton) {
      nextPageButton.click()
      console.log('nextPageButton clicked')
      await delay(DOM_DELAY) // 等待页面加载完成
      await getMaxPage() // 更新当前页码
    } else {
      $handleError('未找到下一页按钮')
    }
  } else {
    console.log('已经是最后一页')
  }
  await delay(DOM_DELAY) // 等待页面加载
}

// 跳转到某一页
function goToPage(page) {
  return new Promise(async (resolve, reject) => {
    await getMaxPage()
    page = Number(page)
    console.log('跳转到：', page)
    if (page < 1 || page > maxPage) {
      console.error('页码超出范围')
      reject('页码超出范围')
      return
    }

    while (currentPage !== page) {
      if (page < currentPage) {
        await prevPage()
      } else if (page > currentPage) {
        await nextPage()
      }
    }

    console.log(`已经跳转到第${page}页`)
    resolve(page)
  })
}

// 点击管理跳转子账号页面
async function goToChildPage() {
  const task = parseJSON(localStorage.getItem('task'), {})
  const dataLists = parseJSON(localStorage.getItem('dataList'), [])
  const childIndex = dataLists.findIndex((item) => item.dyAccountNo === task.dyUserId)
  console.log(childIndex, 'childIndex')
  // 先判断childIndex在第几页
  if (childIndex === -1) {
    console.log(' 子账号没找到 ')
    return
  }
  // 每页5个元素，计算元素所在的页码
  const itemsPerPage = 5
  const pageIndex = Math.ceil((childIndex + 1) / itemsPerPage)

  console.log(pageIndex, 'pageIndex')
  // 进入对应页码
  await goToPage(pageIndex || 1)

  // 获取当前页面的table
  getTable(task)
}

// 获取要开始的任务
async function getTask() {
  try {
    const res = await $Request(getTaskApi)
    if (!res) {
      localStorage.setItem('taskStatus', '0')
      messageCreate('没有新的任务')
      return
    }
    localStorage.setItem('task', JSON.stringify(res))
    await delay(DOM_DELAY)
    // 进入子账号页面
    goToChildPage()
  } catch (error) {
    $handleError(error)
  }
}

// 获取子页面上导航栏
async function toChildUploadPage() {
  try {
    // 找到navList中的所有li元素
    const navListItems = await waitForElement('.semi-navigation-list li', { isAll: true })
    console.log(navListItems)
    if (navListItems && navListItems.length) {
      navListItems[1].click()
      console.log('子页面上导航栏 clicked')
    }
  } catch (error) {
    $handleError(error)
  }
}

// 通过接口获取文件路径
async function uploadVideoFn() {
  // 获取任务数据
  const task = parseJSON(localStorage.getItem('task'), {})
  const { filePath, videoName } = task

  try {
    const file = await urlToFile(filePath, videoName)
    // 获取上传按钮，并将file上传
    const inputElement = await waitForElement('input[type="file"][name="upload-btn"]', {
      isAll: true
    })
    if (inputElement[0]) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      inputElement[0].files = dataTransfer.files

      // 触发 change 事件以确保上传组件检测到文件
      const event = new Event('change', { bubbles: true })
      inputElement[0].dispatchEvent(event)

      console.log('File uploaded successfully')
      // 检查视频是否已经加载好
      checkUploadVideo()
    } else {
      $handleError('未找到上传按钮')
    }
  } catch (error) {
    $handleError(error)
  }
}

// 上传后检查是否加载成功
async function checkUploadVideo() {
  try {
    const videoElement = await waitForElement('video')
    if (videoElement) {
      // 检查视频是否已经加载好
      if (videoElement.readyState >= 3) {
        console.log('videoElement already loaded')
        reloadPage()
      } else {
        console.log('videoElement not yet loaded, adding event listener')
        videoElement.addEventListener('loadeddata', async () => {
          console.log('videoElement loadeddata')
          reloadPage()
        })
      }
    } else {
      // 如果视频元素不存在，输出错误信息,并继续调用checkUploadVideo
      $handleError('未找到视频元素')
      await delay(DOM_DELAY)
      checkUploadVideo()
    }
  } catch (error) {
    $handleError(error)
  }
}

// 视频加载完毕后写入缓存准备发布
async function publishVideo(_videoElement) {
  try {
    // 检查是否需要重新写入缓存
    const cacheFlag = localStorage.getItem('isResetCache')
    console.log(cacheFlag, 'cacheFlag')

    if (cacheFlag !== '1') {
      const flag = await autoFillForm()
      if (flag) {
        reloadPage()
      } else {
        $handleError('表单自动填写失败')
      }
    } else {
      // 已经填写过表单，进行发布操作
      console.log('表单已自动填写，进行发布操作')
      await publishTimePickerSelect()
      console.log('点击发布按钮')
      await delay(DOM_DELAY)
      await publishSuccess()
      await delay(DOM_DELAY)
      const publishButtons = await waitForElement('button', { isAll: true })
      // 遍历按钮，查找内容为 "发布" 的按钮
      for (const button of publishButtons) {
        if (button.textContent.trim() === '发布') {
          button.click()
          await delay(PAGE_DELAY)
          // 退出代运营状态
          window.location.href = childContentPage
        }
      }
    }
  } catch (error) {
    console.error('表单自动填写过程中出现错误:', error)
    $handleError(error)
  }
}

// 自动填充表单，写入缓存后刷新一次页面，如果再次进入则不再填充
async function autoFillForm() {
  return new Promise(async (resolve, reject) => {
    let flag = false
    try {
      // 获取任务数据
      const task = parseJSON(localStorage.getItem('task'), {})

      // 获取缓存数据
      const cacheList = await getStorageKey()
      //
      if (cacheList && cacheList.length) {
        console.log('获取缓存list', cacheList)
        cacheList.forEach((item) => {
          const cacheItem = localStorage.getItem(item)
          if (!cacheItem || cacheItem === 'null' || cacheItem === 'undefined') {
            return
          }
          // 获取缓存数据
          const { type, cache } = parseJSON(cacheItem, {})
          // 重新赋值 cache 数据
          const newCacheData = {
            ...cache,
            itemTitle: task.videoName,
            textResult: {
              text: task.topicName ? task.remark + task.topicName : task.remark,
              textExtra: [],
              activity: [],
              caption: task.topicName ? task.remark + task.topicName : task.remark
            }
          }
          const newData = JSON.stringify({ type, cache: newCacheData })
          localStorage.setItem(item, newData)
        })
      } else {
        console.log('没有找到缓存')
        $handleError('没有找到缓存')
        return
      }
      // 如果有话题，需要做话题操作
      if (task.topicName) {
        await topicOperation(task.topicName)
      }
      await delay(DOM_DELAY)

      // 如果有poi地址，需要做poi操作
      if (task && task.task && task.task.poiAddressName) {
        await poiOperation(task.task.poiAddressName)
      }

      console.log('表单自动填写成功')

      // 设置标志位，表明已经填写过表单
      localStorage.setItem('isResetCache', '1')
      flag = true
      resolve(flag) // 返回成功标志
    } catch (error) {
      console.error('autoFillForm 出现错误:', error)
      $handleError(error)
      reject(error) // 返回错误信息
    }
  })
}

// 话题操作
async function topicOperation(txt) {
  txt = txt.replace('#', '')
  await delay(PAGE_DELAY)
  const element = await waitForElement('.mention-suggest-mount-dom span', { isAll: true })
  console.log(element, 'element', txt)
  // 找到所有的span标签，如果是#则点击索引为0的span标签
  if (element && element.length) {
    const span = Array.from(element).find((item) => item.innerText === txt)
    if (span) {
      // 找到span的父元素
      const parent = span.parentElement
      console.log(parent, 'span---话题点击了')
      parent.click()
    }
  }
}

// POI地址操作
async function poiOperation(txt) {
  await delay(PAGE_DELAY)
  const select = await waitForElement('#douyin_creator_pc_anchor_jump .semi-select-selection')
  console.log(select, 'select')
  // 下拉选择点击
  select.click()
  await delay(DOM_DELAY)
  // 找到input
  const input = await waitForElement(
    '#douyin_creator_pc_anchor_jump .semi-select-selection input[type="text"]'
  )
  input.value = txt
  // 触发input的input事件
  input.dispatchEvent(new Event('input', { bubbles: true }))
  console.log(input, 'input----dispatchEvent', txt)
  await delay(DOM_DELAY)
  // 找到popover-content
  const popoverContent = await waitForElement(
    '.semi-popover .semi-popover-content .semi-select-option-list .semi-select-option',
    { isAll: true }
  )
  console.log(popoverContent, 'popoverContent')
  if (popoverContent && popoverContent.length) {
    // 点击第一个
    popoverContent[0].click()
    console.log(popoverContent[0], 'poi点击了')
  }
}

// 发布成功后通知后台
async function publishSuccess() {
  try {
    // 获取任务数据
    const task = parseJSON(localStorage.getItem('task'), {})
    const res = await $Request(updateAutoPublishTaskApi, {
      params: {
        id: task.id
      }
    })
    console.log(res, '发布成功接口---res')
  } catch (error) {
    $handleError(error)
  }
}

// 退出登录
async function childLogout() {
  try {
    await delay(DOM_DELAY) // 等待页面加载

    const logoutButton = await waitForElement('.semi-navigation-footer .semi-avatar')
    // 获取按钮的具体位置
    const logoutButtonRect = logoutButton.getBoundingClientRect()
    simulateMouseMove(
      logoutButtonRect.x + logoutButtonRect.width / 2,
      logoutButtonRect.y + logoutButtonRect.height / 2
    )
    console.log('logoutButton clicked')

    await delay(DOM_DELAY) // 等待下拉菜单出现
    const logout = await waitForElement('.semi-portal .logout')
    console.log(logout)

    if (logout) {
      logout.click()
      console.log('logout clicked')
    } else {
      // 重新进入子账号页面
      window.location.href = childContentPage
    }
  } catch (error) {
    console.error('Error during logout:', error)
    $handleError(error)
  }
}

// 工具函数

// 元素查找函数
async function waitForElement(selector, options = {}) {
  const querySelectorAll = options.isAll || false
  const timeout = options.timeout || 10000 // 每次尝试的超时时间
  const interval = options.interval || DOM_DELAY // 检查间隔
  const retryDelay = options.retryDelay || DOM_DELAY // 每次重试之间的等待时间
  const maxRetries = options.maxRetries || 50 // 最大重试次数

  let retries = 0

  function checkElement() {
    return querySelectorAll ? document.querySelectorAll(selector) : document.querySelector(selector)
  }

  // 等待 DOMContentLoaded 事件
  if (document.readyState === 'loading') {
    await new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true })
    })
  }

  while (retries < maxRetries) {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      const element = checkElement()
      if (element && (querySelectorAll ? element.length > 0 : true)) {
        return element
      }
      await delay(interval)
    }
    // 如果达到这里，说明本次尝试超时
    console.log(`Attempt ${retries + 1} failed. Retrying after ${retryDelay}ms...：${selector}`)
    await delay(retryDelay)
    retries++
  }

  throw new Error(`Element not found after ${maxRetries} retries: ${selector}`)
}

// 延迟函数
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 将 OSS URL 转换为 File 对象的函数
async function urlToFile(url, name) {
  // 使用 fetch 获取文件的 Blob 数据
  const response = await fetch(url)
  const blob = await response.blob()
  // 随机文件名
  const fileName = `${name}-${Date.now()}.mp4`
  // 获取文件类型
  const fileType = blob.type
  console.log({ fileName, fileType })
  // 将 Blob 转换为 File 对象
  return new File([blob], fileName, { type: fileType })
}

// 模拟鼠标移动到指定坐标
function simulateMouseMove(x, y) {
  const mouseEnterEvent = new MouseEvent('mouseenter', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  })

  const mouseOverEvent = new MouseEvent('mouseover', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x + 3,
    clientY: y + 3
  })

  const targetElement = document.elementFromPoint(x, y)
  console.log(targetElement, 'targetElement')
  if (targetElement) {
    // targetElement.dispatchEvent(mouseMoveEvent);
    targetElement.dispatchEvent(mouseEnterEvent)
    targetElement.dispatchEvent(mouseOverEvent)
    console.log(`Simulated mouse move and enter to: (${x}, ${y})`)
  } else {
    console.error('No element found at the specified coordinates:', x, y)
    $handleError('No element found at the specified coordinates')
  }
}

// // TODO: 暂时用内部的，后续需要改成外部的request.js

// 通用的调用接口方法
function $Request(url = '', { options = {}, params = {} } = {}) {
  const requestURL = baseURL + url
  console.log('接口请求开始')

  return new Promise((resolve, reject) => {
    fetch(requestURL, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': options.contentType || 'application/json'
      },
      ...(options.method === 'GET' ? {} : { body: JSON.stringify(params) })
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data, '接口请求返回的data')
        if (data.code === 200) {
          resolve(data.data)
        } else {
          $handleError(`接口返回错误: ${data.message}`)
          reject(new Error(`接口返回错误: ${data.message}`))
        }
      })
      .catch((error) => {
        console.error('Fetch Error:', error)
        $handleError(`Fetch Error:: ${error}`)
        reject(error)
      })
  })
}

// 错误处理函数，将错误信息存储在 localStorage 中
async function $handleError(error) {
  console.log('发生错误:', error)
  const task = parseJSON(localStorage.getItem('task'), {})
  const errorLogs = parseJSON(localStorage.getItem('errorLogs'), [])
  const errorLog = {
    message: error.message || error,
    stack: error.stack,
    time: new Date().toISOString()
  }
  errorLogs.push(errorLog)
  localStorage.setItem('errorLogs', JSON.stringify(errorLogs))
  const api = '/admin/autopublishtask/updateAutoPublishTask'
  await $Request(api, {
    params: {
      id: task.id,
      msg: task.id + ':' + error.message || error + '_____' + new Date().toISOString()
    }
  })
}

// 清除缓存数据
function removeStorageKey() {
  return new Promise((resolve, reject) => {
    // 定义要查找的前缀
    const prefix = 'publish_form_cache:'
    // 遍历 localStorage 中的所有键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      // 检查键是否以指定前缀开头
      if (key.includes(prefix)) {
        console.log('key----' + key)
        // 获取该键的值
        const cachedData = localStorage.getItem(key)
        // 检查键是否存在
        if (cachedData) {
          // 删除指定的键
          localStorage.removeItem(cachedData)
          resolve('已删除指定的键')
        } else {
          reject(new Error('未找到指定的键'))
        }
      }
    }
  })
}

// 获取缓存数据
function getStorageKey() {
  return new Promise((resolve, reject) => {
    // 定义要查找的前缀
    const prefix = 'publish_form_cache:'
    const cachedDataList = []

    // 遍历 localStorage 中的所有键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      // 检查键是否以指定前缀开头
      if (key.includes(prefix)) {
        console.log('key----' + key)

        // 获取该键的值
        const cachedData = localStorage.getItem(key)
        console.log('找到的数据:', parseJSON(cachedData, []))
        // 将数据添加到结果列表中
        cachedDataList.push(key)
      }
    }

    // 检查是否找到了匹配的数据
    if (cachedDataList.length > 0) {
      resolve(cachedDataList)
    } else {
      reject(new Error('未找到匹配的键'))
    }
  })
}

// 等待页面加载完成
function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve()
    } else {
      window.addEventListener('load', () => {
        resolve()
      })
    }
  })
}

// 重新加载页面
async function reloadPage(timeout = PAGE_DELAY) {
  await delay(timeout)
  window.location.reload()
}

// 解析JSON
function parseJSON(jsonString = '', defaultValue = null) {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    return defaultValue
  }
}

// 发送通知
function messageCreate(message) {
  // 发送消息
  chrome.runtime.sendMessage({ action: 'fromContent', message })
}
