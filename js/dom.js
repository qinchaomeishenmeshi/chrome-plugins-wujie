function disablePopups() {
  window.alert = function () {
    console.log('Alert blocked.')
  }
  window.confirm = function () {
    console.log('Confirm blocked.')
    return false
  }
  window.prompt = function () {
    console.log('Prompt blocked.')
    return null
  }
}

// 执行重写函数
disablePopups()

// 延迟函数
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 元素查找函数
async function waitForElement(selector, options = {}) {
  const querySelectorAll = options.isAll || false
  const timeout = options.timeout || 10000 // 每次尝试的超时时间
  const interval = options.interval || DELAY.DOM_DELAY // 检查间隔
  const retryDelay = options.retryDelay || DELAY.DOM_DELAY // 每次重试之间的等待时间
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

  createNotification(`Element not found after ${maxRetries} retries: ${selector}`)
  $handleError(`Element not found after ${maxRetries} retries: ${selector}`)
  throw new Error(`Element not found after ${maxRetries} retries: ${selector}`)
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

// 滚动到目标位置
async function simulateWheelEvent(list, target, retryCount = 0, maxRetries = 5) {
  return new Promise(async (resolve, reject) => {
    const targetLi = Array.from(list).find((li) => li.textContent.trim().includes(target))

    if (!targetLi) {
      console.error('simulateWheelEvent error: 未找到目标元素')
      $handleError('simulateWheelEvent error: 未找到目标元素')
      reject('simulateWheelEvent error: 未找到目标元素')
      return
    }

    try {
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
            console.error('simulateWheelEvent error: Exceeded maximum retries')
            resolve()
          }
        }
      }

      // 开始检查滚动位置
      setTimeout(checkPosition, 1000)
    } catch (error) {
      console.error('模拟鼠标滚轮事件的函数error:', error)
      reject('模拟鼠标滚轮事件的函数error')
    }
  })
}


// 模拟点击，返回一个 Promise
async function simulateClick(element) {
  if (!element) {
    console.error('Element not found:', element)
    $handleError('Element not found')
    return
  }
  return new Promise((resolve) => {
    element.click()
    // 模拟点击完成
    setTimeout(resolve, DELAY.DOM_DELAY)
  })
}
