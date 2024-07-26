// 延迟函数
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForElement(selector, options = {}) {
  const { isAll = false, timeout = 5 * 60 * 1000 } = options

  return new Promise((resolve, reject) => {
    const start = Date.now()
    const interval = setInterval(() => {
      console.log('waiting for element:', selector)
      const element = isAll ? document.querySelectorAll(selector) : document.querySelector(selector)
      if (element && (isAll ? element.length > 0 : true)) {
        clearInterval(interval)
        resolve(element)
      } else if (Date.now() - start >= timeout) {
        clearInterval(interval)
        reject(new Error(`Element not found: ${selector}`))
      }
    }, 200)
  })
}

// 模拟滚动
async function simulateScroll(element, targetPosition, duration = 1000) {
  const start = element.scrollTop
  const change = targetPosition - start
  const startTime = performance.now()

  function animateScroll(currentTime) {
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1) // 0 to 1
    element.scrollTop = start + change * progress

    if (progress < 1) {
      requestAnimationFrame(animateScroll)
    }
  }

  return new Promise((resolve) => {
    animateScroll(performance.now())
    setTimeout(resolve, duration)
  })
}

// 模拟鼠标移动到指定坐标
function simulateMouseMove(x, y) {
  return new Promise((resolve, reject) => {
    try {
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
      console.log(targetElement, '目标元素')

      if (targetElement) {
        targetElement.dispatchEvent(mouseEnterEvent)
        targetElement.dispatchEvent(mouseOverEvent)
        console.log(`模拟鼠标移动和进入坐标: (${x}, ${y})`)
        resolve(true)
      } else {
        $handleError('在指定坐标没有找到元素')
        reject(new Error('在指定坐标没有找到元素'))
      }
    } catch (error) {
      $handleError(`模拟鼠标移动时发生错误: ${error.message}`)
      reject(error)
    }
  })
}

// 滚动到目标位置
async function simulateWheelEvent(list, target, retryCount = 0, maxRetries = 10) {
  return new Promise(async (resolve, reject) => {
    try {
      const targetLi = Array.from(list).find((li) => li.textContent.trim().includes(target))

      if (!targetLi) {
        $handleError('simulateWheelEvent error: 未找到目标元素')
        reject('simulateWheelEvent error: 未找到目标元素')
        return
      }

      console.log(target, 'target')
      // 使用 scrollIntoView 方法滚动到目标元素
      targetLi.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await delay(DELAY.DOM_DELAY)
      resolve()

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
            $handleError('simulateWheelEvent error: Exceeded maximum retries')
            resolve()
          }
        }
      }

      // 开始检查滚动位置
      setTimeout(checkPosition, 500)
    } catch (error) {
      $handleError('模拟鼠标滚轮事件的函数error' + JSON.stringify(error))
      reject('模拟鼠标滚轮事件的函数error')
    }
  })
}

// 模拟点击，返回一个 Promise
async function simulateClick(element, timeout = DELAY.DOM_DELAY) {
  if (!element) {
    $handleError('simulateClick Element not found')
    return
  }
  return new Promise((resolve) => {
    element.click()
    // 模拟点击完成
    setTimeout(resolve, timeout)
  })
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

    // 如果发布时间为空或小于当前时间后的2小时内，则立即发布
    if (!t || new Date(t).getTime() < new Date().getTime() + 2 * 60 * 60 * 1000) {
      $handleError(task.sendTime + '----发布时间为空或小于当前时间后的2小时内，则立即发布')
      await selectPublishType(false)
      resolve(true)
      return
    }
    await selectPublishType(true)
    // 打开日期选择器
    await selectDateTime()
    // 找到当前日期
    const currentDateTime = await getCurrentDate()
    if (currentDateTime === t) {
      console.log('当前选择为dateTime日期，则匹配时间')
      // 选择时间
      await selectTime(hour, minute)
      resolve(true)
    } else {
      const currentYear = currentDateTime.split('-')[0]
      const currentMonth = currentDateTime.split('-')[1]
      console.log('当前选择不是dateTime日期，判断是否为当前年月')
      console.log(currentYear, 'currentYear')
      console.log(currentMonth, 'currentMonth')
      console.log(month, 'month')
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
        // 去掉月之前的0
        const newMonth = month.replace(/^0+/, '')
        // 选择年月
        await selectMonth(year, newMonth)
        await delay(DELAY.DOM_DELAY)
        // 选择日期
        await selectDate(day)
        await delay(DELAY.DOM_DELAY)
        // 选择时间
        await selectTime(hour, minute)
        resolve(true)
      }
    }
  })
}

// 选择定时发布或者立即发布
async function selectPublishType(isTiming) {
  console.log(isTiming, '选择定时发布或者立即发布')
  // 找到所有label标签
  const labels = await waitForElement('label>span', { isAll: true })

  if (labels && labels.length && isTiming) {
    // 找到innerText为“定时发布”的label标签，点击定时发布
    const label = Array.from(labels).find((item) => item.innerText === '定时发布')
    console.log(label, 'label')
    await simulateClick(label)
  } else {
    // 立即发布
    const label = Array.from(labels).find((item) => item.innerText === '立即发布')
    console.log(label, 'label')
    await simulateClick(label)
  }
}

// 选择定时发布后，点击日期选择器
async function selectDateTime() {
  // 打开日期选择器
  const datePickerElement = await waitForElement('.semi-datepicker>.semi-datepicker-input')
  console.log(datePickerElement, '日期选择器')
  await simulateClick(datePickerElement)
  console.log('点击日期选择器')
}

// 获取当前日期
function getCurrentDate() {
  return new Promise(async (resolve, reject) => {
    try {
      // 找到当前日期元素
      const currentDate = await waitForElement('.semi-datepicker-day.semi-datepicker-day-today')

      if (currentDate) {
        // 获取属性 title 的值
        const currentDateTime = currentDate.getAttribute('title')

        console.log(currentDateTime, '当前日期标题')
        resolve(currentDateTime)
      } else {
        $handleError('未能找到当前日期元素')
        reject(new Error('未能找到当前日期元素'))
      }
    } catch (error) {
      $handleError(`获取当前日期时发生错误: ${error.message}`)
      reject(error)
    }
  })
}

// 选择年月
async function selectYearMonth(year, month) {
  // 年月选择开始
  const datePickerHeader = await waitForElement('.semi-datepicker-navigation-month>button')
  console.log(datePickerHeader, 'datePickerHeader')
  // 如果不是，则点击
  await simulateClick(datePickerHeader)
  //  年份列表
  const yearMonthSelect = await waitForElement(
    '.semi-scrolllist-body>.semi-scrolllist-item-wheel',
    { isAll: true }
  )
  const yearList = yearMonthSelect[0].querySelectorAll('li')
  console.log(yearList, 'yearList')
  simulateWheelEvent(yearList, year)
  await delay(3000)
  // 月份列表
  const monthList = yearMonthSelect[1].querySelectorAll('li')
  console.log(monthList, 'monthList')
  simulateWheelEvent(monthList, month)
  await delay(DELAY.DOM_DELAY)
  // 点击返回日期选择
  const backBtn = await waitForElement('.semi-datepicker-yearmonth-header>button')
  console.log(backBtn, 'backBtn')
  await simulateClick(backBtn)
  // 年月选择结束
}

async function selectMonth(year, month) {
  const currentDate = new Date()
  const targetDate = new Date(year, month - 1) // month is 1-based, JavaScript Date uses 0-based months

  if (targetDate > currentDate) {
    console.log('下个月')
    const monthBtns = await waitForElement('.semi-datepicker-navigation button', {
      isAll: true
    })
    console.log(monthBtns, 'monthBtns')
    const nextMonthBtn = monthBtns[2] // assuming index 1 is the next month button
    // 添加点击事件
    await simulateClick(nextMonthBtn)
    console.log(nextMonthBtn, 'nextMonthBtn')
  }
}

// 选择日期
async function selectDate(day) {
  // 如果day是0开头，则去掉0
  day = day.toString().replace(/^0/, '')
  const dateList = await waitForElement('.semi-datepicker-month .semi-datepicker-day', {
    isAll: true
  })
  console.log(dateList, 'dateList')
  console.log(day, 'day')
  // 找到dateList中的day
  const dateElement = Array.from(dateList).find((element) => element.textContent.trim() === day)
  console.log(dateElement, '日期')
  await simulateClick(dateElement)
}

// 选择时间
async function selectTime(hour, minute) {
  // 先将页面滚动到底部
  window.scrollTo(0, document.body.scrollHeight)
  // 时间选择按钮
  const timePicker = await waitForElement('.semi-datepicker-switch-time')
  console.log(timePicker, 'timePicker')
  await simulateClick(timePicker)
  // 时间列表
  const selectList = await waitForElement('.semi-scrolllist-body>.semi-scrolllist-item-wheel', {
    isAll: true
  })
  // 获取要触发双击事件的 li 元素
  const hourList = selectList[0].querySelectorAll('li')
  await simulateWheelEvent(hourList, hour)
  const minuteList = selectList[1].querySelectorAll('li')
  await simulateWheelEvent(minuteList, minute)
}

// 时间选择框操作 - 结束

// 获取最大页码数
async function getMaxPage() {
  return new Promise(async (resolve, reject) => {
    try {
      // 获取分页器的元素
      const pageDiv = await waitForElement(
        '.douyin-creator-pc-page-item.douyin-creator-pc-page-item-small'
      )

      if (pageDiv) {
        // 获取div的文本内容
        const pageText = pageDiv.innerText.trim()
        const pageParts = pageText.split('/')

        if (pageParts.length === 2) {
          currentPage = Number(pageParts[0])
          maxPage = Number(pageParts[1])

          console.log('currentPage: ' + currentPage)
          console.log('maxPage: ' + maxPage)

          resolve(maxPage)
        } else {
          $handleError('获取最大页码数失败: ' + pageText)
          reject()
        }
      } else {
        resolve(1)
      }
    } catch (error) {
      $handleError('获取最大页码数失败: ' + error.message)
      reject(error)
    }
  })
}

// 点击上一页
async function prevPage() {
  return new Promise(async (resolve, reject) => {
    try {
      if (currentPage > 1) {
        const prevPageButton = document.querySelector(
          '.douyin-creator-pc-page-item.douyin-creator-pc-page-prev'
        )
        if (prevPageButton) {
          await simulateClick(prevPageButton)
          console.log('prevPageButton clicked')
          resolve(true)
        } else {
          $handleError('未找到上一页按钮')
          reject(false)
        }
      } else {
        console.log('已经是第一页')
        resolve(false)
      }
    } catch (error) {
      $handleError(error)
      reject(error)
    }
  })
}

// 点击下一页
async function nextPage() {
  return new Promise(async (resolve, reject) => {
    try {
      if (currentPage < maxPage) {
        const nextPageButton = document.querySelector(
          '.douyin-creator-pc-page-item.douyin-creator-pc-page-next'
        )
        if (nextPageButton) {
          await simulateClick(nextPageButton)
          console.log('nextPageButton clicked')
          resolve(true)
        } else {
          $handleError('未找到下一页按钮')
          reject(false)
        }
      } else {
        console.log('已经是最后一页')
        resolve(false)
      }
    } catch (error) {
      $handleError(error)
      reject(error)
    }
  })
}

// 滚动并跳转到制定页码
function goToPage(pageIndex = 1) {
  return new Promise(async (resolve, reject) => {
    try {
      // 获取最大页码
      await getMaxPage()
      // pageIndex如果不是数字，转换为数字
      pageIndex = Number(pageIndex)
      console.log('跳转到：', pageIndex)

      // 如果pageIndex小于1或者大于maxPage，输出错误信息
      if (pageIndex < 1 || pageIndex > maxPage) {
        $handleError('页码超出范围')
        reject('页码超出范围')
        return
      }

      const element = await waitForElement(
        '.douyin-creator-pc-page-item.douyin-creator-pc-page-item-small'
      )

      // 将滚动条滚动到页面最底部
      window.scrollTo(0, document.body.scrollHeight)
      // 获取element的位置，并将鼠标移动到element的位置中心点
      const rect = element.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      // 移动到element的位置
      await simulateMouseMove(x, y)

      //
      const listElement = await waitForElement('.douyin-creator-pc-page-rest-list')
      console.log(listElement, 'listElement')

      // 滚动次数和每次滚动的步长
      const pageHeight = 32 // 每页高度，单位像素
      const scrollStep = pageHeight * 7 // 每次滚动7页的像素高度
      let pageItem

      // 如果页码小于等于7，直接点击
      if (pageIndex <= 7) {
        pageItem = await waitForElement(
          `.douyin-creator-pc-page-rest-item[aria-label="${pageIndex}"]`,
          { timeout: 1000 }
        )
        console.log(`找到第${pageIndex}页`, pageItem)

        simulateClick(pageItem, 500)
        console.log(`点击第${pageIndex}页`)
        resolve(true)
        return
      }

      // 模拟滚动找到指定页码
      for (let i = 0; i < 20; i++) {
        await simulateScroll(listElement, listElement.scrollTop + scrollStep, 500)
        pageItem = await waitForElement(
          `.douyin-creator-pc-page-rest-item[aria-label="${pageIndex}"]`,
          { timeout: 500 }
        ).catch(() => null)
        if (pageItem) break
      }

      if (pageItem) {
        console.log(`找到第${pageIndex}页`, pageItem)
        simulateClick(pageItem, 500)

        console.log(`点击第${pageIndex}页`)
        resolve(true)
      } else {
        $handleError(`未能找到第${pageIndex}页`)
        resolve(false)
      }
    } catch (error) {
      $handleError(error)
      reject(error)
    }
  })
}
