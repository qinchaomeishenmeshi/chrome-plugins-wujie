// 接收来自popup的消息
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log(
    `收到来自 ${
      sender.tab ? 'content-script(' + sender.tab.url + ')' : 'popup或者background'
    } 的消息：`,
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
    case 'pushTask': // 推送任务
      pushTask()
      break
    case 'sync': // 同步账号
      createNotification('准备开始同步账号')
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

  // 测试页面
  if (window.location.href.includes(PAGE.systemPage)) {
    const pushBtn = await waitForElement('#pushTaskBtn')
    console.log(pushBtn, 'pushBtn')
    // 如果pushBtn存在，则添加事件监听
    if (pushBtn) {
      pushBtn.addEventListener('click', async () => {
        // 发送系统通知
        chrome.runtime.sendMessage({ action: 'pushTask' })
      })
    }
  }

  // 任务执行状态
  const taskStatus = localStorage.getItem('taskStatus')

  //
  if (taskStatus !== '1') {
    console.log('任务状态不为1，不执行操作')
    return
  }

  // 分页面进行操作
  console.log('当前页面：', window.location.href)
  switch (window.location.href) {
    case PAGE.creatorHomePage: // 机构号首页-获取任务
      getTask()
      break
    case PAGE.childCreatorHomePage: // 子账号首页
      createNotification('进入子账号')
      // 重新设置缓存标志位
      localStorage.setItem('isResetCache', '0')
      // 进入子页面先清空历史缓存数据
      await removeStorageKey()
      // 跳转到子账号页面的上传
      toChildUploadPage()
      break
    case PAGE.childUploadPage: // 子账号上传页面
      //  点击上传按钮
      uploadVideoFn()
      break

    case PAGE.childPublishPage: // 子账号发布页面
      // 点击发布按钮
      publishVideo()
      break

    case PAGE.childContentPage: // 子账号内容管理页面
      // 退出代运营状态
      childLogout()
      break

    default: // 其他页面
      break
  }
}
// 页面加载完成后执行监听
watchPage()

// 获取chrome缓存的tabId
async function getDouyinTabId() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getDouyinTabId' }, (response) => {
      console.log('getDouyinTabId---response', response)
      resolve(response)
    })
  })
}

async function pushTask() {
  console.log('混剪点击了。pushTask')
  createNotification('收到推送任务准备开始')
  localStorage.setItem('taskStatus', '1')
  getTask()
}

// 时间选择框操作 - 开始
// 时间选择
async function publishTimePickerSelect(_dateTime) {
  const task = getCacheTask()
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
    await delay(DELAY.DOM_DELAY)
    // 打开日期选择器
    await selectDateTime()
    await delay(DELAY.DOM_DELAY)
    // 找到当前日期
    const currentDateTime = await getCurrentDate()
    if (currentDateTime === t) {
      console.log('当前选择为dateTime日期，则匹配时间')
      // 选择时间
      await selectTime(hour, minute)
      await delay(DELAY.DOM_DELAY)
      resolve(true)
    } else {
      const currentYear = currentDateTime.split('-')[0]
      const currentMonth = currentDateTime.split('-')[1]
      console.log('当前选择不是dateTime日期，判断是否为当前年月')
      if (currentYear === year && currentMonth === month) {
        console.log('年月相同，直接选择日期')
        // 选择日期
        await selectDate(day)
        await delay(DELAY.DOM_DELAY)
        // // 选择时间
        await selectTime(hour, minute)
        await delay(DELAY.DOM_DELAY)
        resolve(true)
      } else {
        console.log('年月不同，先选择年月，再选择日期')
        // 选择年月
        await selectYearMonth(year, month)
        await delay(DELAY.DOM_DELAY)
        // 选择日期
        await selectDate(day)
        await delay(DELAY.DOM_DELAY)
        // 选择时间
        await selectTime(hour, minute)
        await delay(DELAY.DOM_DELAY)
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
  await delay(DELAY.DOM_DELAY)
  //  年份列表
  const yearMonthSelect = await waitForElement(
    '.semi-scrolllist-body>.semi-scrolllist-item-wheel',
    { isAll: true }
  )
  const yearList = yearMonthSelect[0].querySelectorAll('li')
  console.log(yearList, 'yearList')
  simulateWheelEvent(yearList, year)
  await delay(DELAY.DOM_DELAY)
  // 月份列表
  const monthList = yearMonthSelect[1].querySelectorAll('li')
  console.log(monthList, 'monthList')
  simulateWheelEvent(monthList, month)
  await delay(DELAY.DOM_DELAY)
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
  await delay(DELAY.DOM_DELAY)
  // 时间列表
  const selectList = await waitForElement('.semi-scrolllist-body>.semi-scrolllist-item-wheel', {
    isAll: true
  })
  // 获取要触发双击事件的 li 元素
  const hourList = selectList[0].querySelectorAll('li')
  await simulateWheelEvent(hourList, hour)
  await delay(DELAY.DOM_DELAY)
  const minuteList = selectList[1].querySelectorAll('li')
  await simulateWheelEvent(minuteList, minute)
}

// 时间选择框操作 - 结束

// 保持登陆使用---重新加载table
async function reloadTable() {
  try {
    // 获取最大页码
    await getMaxPage()
    // 如果不是最后一页，轮流跳转到最后一页
    while (currentPage < maxPage) {
      nextPage()
      await delay(DELAY.PAGE_DELAY)
    }
    // 如果是最后一页，再次获取最大页码
    await getMaxPage()
    // 如果不是第一页，轮流跳转到第一页
    while (currentPage > 1) {
      prevPage()
      await delay(DELAY.PAGE_DELAY)
    }
    // 如果是第一页，再次获取最大页码
    await getMaxPage()
    // 10秒后重新获取表格数据
    await delay(DELAY.PAGE_DELAY)
    reloadTable()
  } catch (error) {
    $handleError(error)
  }
}

// 机构号-子账号列表操作-开始

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

// 获取所有账号列表数据
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

      // 打印收集到的数据
      console.log(dataList)

      if (dataList && dataList.length >= 5) {
        // 获取最大页码
        await getMaxPage()

        // 递归调用获取下一页数据
        if (currentPage < maxPage) {
          createNotification('已获取子账号：' + dataList.length)
          await nextPage()
          await getTableAll()
        } else {
          console.log('所有页面的数据已获取完毕')
          createNotification('所有页面的数据已获取完毕，准备同步')
          syncAccount()
        }
      } else {
        // 如果没有5个以上的子账号，直接同步
        syncAccount()
      }
    } else {
      createNotification('同步失败，未找到子账号列表')
      throw new Error('未找到表格的tbody元素')
    }
  } catch (error) {
    retryCount++
    // 重新获取table
    if (retryCount < maxRetryCount) {
      await getTableAll()
    } else {
      console.error('重试次数已达上限')
      $handleError(error)
    }
  }
}

// 获取机构号
async function getMainAccountId() {
  const accountElement = await waitForElement('#sub-app p', { isAll: true })
  const mainAccountId = accountElement[0].innerText.trim()
  return mainAccountId
}

// 同步账号信息
async function syncAccount() {
  const mainAccountId = await getMainAccountId()
  // 去重
  const params = [...new Set(dataList)].map((item) => {
    return {
      mainAccountId,
      ...item
    }
  })
  try {
    // 调用接口传递给后台
    const res = await $Request(API.syncAccountApi, {
      params
    })
    localStorage.setItem('dataList', JSON.stringify(params))
    console.log(res, '同步账号接口---res')
    createNotification(`同步账号接口请求结束，本次同步账号：${params.length}个`)
  } catch (error) {
    $handleError(error)
  }
}

// 获取子账号具体位置
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
        createNotification('准备跳转子账号页面')
      } else {
        localStorage.setItem('taskStatus', '0')
        createNotification('未找到子账号，请检查并重新同步账号')
        $handleError('未找到子账号')
        reloadPage()
      }
    }
  } catch (error) {
    retryCount++
    // 重新获取table
    if (retryCount < maxRetryCount) {
      await getTable()
    } else {
      console.error('重试次数已达上限')
      $handleError(error)
    }
  }
}

// 获取最大页码数
async function getMaxPage() {
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
    $handleError('获取最大页码数失败')
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
      await delay(DELAY.DOM_DELAY) // 等待页面加载完成
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
      await delay(DELAY.DOM_DELAY) // 等待页面加载完成
      await getMaxPage() // 更新当前页码
    } else {
      $handleError('未找到下一页按钮')
    }
  } else {
    console.log('已经是最后一页')
  }
  await delay(DELAY.DOM_DELAY) // 等待页面加载
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

// 机构号-子账号列表操作-结束

// 点击管理跳转子账号页面
async function goToChildPage() {
  const itemsPerPage = 5
  const task = getCacheTask()
  const dataLists = parseJSON(localStorage.getItem('dataList'), [])
  const childIndex = dataLists.findIndex((item) => item.dyAccountNo === task.dyUserId)

  console.log(childIndex, 'childIndex')
  // 先判断childIndex在第几页
  if (childIndex === -1) {
    console.log(' 子账号没找到 ')
    return
  }
  // 每页5个元素，计算元素所在的页码
  if (childIndex > 5) {
    const pageIndex = Math.ceil((childIndex + 1) / itemsPerPage)
    console.log(pageIndex, 'pageIndex')
    // 进入对应页码
    await goToPage(pageIndex || 1)
  }
  // 获取当前页面的table
  getTable(task)
}

// 自动化任务执行-开始

// 获取要开始的任务
async function getTask() {
  try {
    const mainAccountId = await getMainAccountId()
    console.log(mainAccountId, 'mainAccountId')
    if (!mainAccountId || mainAccountId === null || mainAccountId === 'null') {
      createNotification('机构号错误，请先重新同步账号')
      return
    }

    createNotification(mainAccountId + '：准备获取要开始的任务')
    const res = await $Request(API.getTaskApi + '?mainAccountId=' + mainAccountId, {})
    if (!res) {
      localStorage.setItem('taskStatus', '0')
      createNotification('没有新的任务')
      return
    }
    localStorage.setItem('task', JSON.stringify(res))
    // 进入子账号页面
    goToChildPage()
  } catch (error) {
    localStorage.setItem('taskStatus', '0')
    createNotification('开始任务失败：' + JSON.stringify(error))
    $handleError(error)
  }
}

// 获取缓存的task任务
function getCacheTask() {
  const task = parseJSON(localStorage.getItem('task'), {})
  return task?.id ? task : {}
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
    } else {
      $handleError('未找到子页面上导航栏')
      reloadPage()
    }
  } catch (error) {
    $handleError(error)
    reloadPage()
  }
}

// 通过接口获取文件路径
async function uploadVideoFn() {
  createNotification('准备上传视频')
  // 获取任务数据
  const task = getCacheTask()
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
  createNotification('检查是否加载成功')
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
      await delay(DELAY.DOM_DELAY)
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
        createNotification('表单自动填写失败')
        $handleError('表单自动填写失败')
      }
    } else {
      // 已经填写过表单，进行发布操作
      console.log('表单已自动填写，进行发布操作')
      createNotification('表单已自动填写，进行发布操作')
      await publishTimePickerSelect()
      console.log('点击发布按钮')
      await delay(DELAY.DOM_DELAY)
      const publishButtons = await waitForElement('button', { isAll: true })
      // 遍历按钮，查找内容为 "发布" 的按钮
      for (const button of publishButtons) {
        if (button.textContent.trim() === '发布') {
          button.click()
          await publishSuccess()
          await delay(DELAY.PAGE_DELAY)
          // 退出代运营状态
          window.location.href = PAGE.childContentPage
        }
      }
    }
  } catch (error) {
    console.error('表单自动填写过程中出现错误:', error)
    createNotification('表单自动填写过程中出现错误')
    $handleError(error)
  }
}

// 自动填充表单，写入缓存后刷新一次页面，如果再次进入则不再填充
async function autoFillForm() {
  createNotification('自动填充表单')
  return new Promise(async (resolve, reject) => {
    let flag = false
    try {
      // 获取任务数据
      const task = getCacheTask()

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
            itemTitle: task.videoName || '',
            textResult: {
              text: task.topicName ? (task.remark || '') + task.topicName : task.remark || '',
              textExtra: [],
              activity: [],
              caption: task.topicName ? (task.remark || '') + task.topicName : task.remark || ''
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
      await delay(DELAY.DOM_DELAY)

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
  await delay(DELAY.PAGE_DELAY)
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
  } else {
    $handleError('没有找到----topicOperation')
  }
}

// POI地址操作
async function poiOperation(txt) {
  await delay(DELAY.PAGE_DELAY)
  const select = await waitForElement('#douyin_creator_pc_anchor_jump .semi-select-selection')
  console.log(select, 'select')
  // 下拉选择点击
  select.click()
  await delay(DELAY.DOM_DELAY)
  // 找到input
  const input = await waitForElement(
    '#douyin_creator_pc_anchor_jump .semi-select-selection input[type="text"]'
  )
  input.value = txt
  // 触发input的input事件
  input.dispatchEvent(new Event('input', { bubbles: true }))
  console.log(input, 'input----dispatchEvent', txt)
  await delay(DELAY.DOM_DELAY)
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
  } else {
    $handleError('没有找到----poiOperation')
  }
}

// 发布成功后通知后台
async function publishSuccess() {
  try {
    // 获取任务数据
    const task = getCacheTask()
    const res = await $Request(API.updateAutoPublishTaskApi, {
      params: {
        id: task.id
      }
    })
    console.log(res, '发布成功接口---res')
    createNotification('发出发布成功接口请求，准备退出代运营状态')
  } catch (error) {
    $handleError(error)
  }
}

// 自动化任务执行-结束

// 退出代运营状态-开始
// 退出登录
async function childLogout() {
  try {
    await delay(DELAY.DOM_DELAY) // 等待页面加载

    const logoutButton = await waitForElement('.semi-navigation-footer .semi-avatar')
    // 获取按钮的具体位置
    const logoutButtonRect = logoutButton.getBoundingClientRect()
    simulateMouseMove(
      logoutButtonRect.x + logoutButtonRect.width / 2,
      logoutButtonRect.y + logoutButtonRect.height / 2
    )
    console.log('logoutButton clicked')

    await delay(DELAY.DOM_DELAY) // 等待下拉菜单出现
    const logout = await waitForElement('.semi-portal .logout')
    console.log(logout)

    if (logout) {
      logout.click()
      console.log('logout clicked')
    } else {
      // 重新进入子账号页面
      window.location.href = PAGE.childContentPage
    }
  } catch (error) {
    console.error('Error during logout:', error)
    $handleError(error)
  }
}

// 退出代运营状态-结束

// 工具函数 - 开始

// 工具函数 - 结束
