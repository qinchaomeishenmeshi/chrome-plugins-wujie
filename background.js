const douyinHomePage = 'https://creator.douyin.com/creator-micro/home'
let douyinTabId = null

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  console.log('onInstalled', reason)
  const tab = await getCurrentTab()
  console.log(tab, '当前tab')
})

// 注入内容脚本并返回一个Promise
function injectContentScript(tabId) {
  console.log(tabId, 'tabId')
  console.log('injectContentScript 脚本注入')
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ['js/request.js', 'content.js']
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message)
          reject(chrome.runtime.lastError.message)
        } else {
          resolve()
        }
      }
    )
  })
}

chrome.runtime.onMessage.addListener((message, callback) => {
  console.log(message, 'background.js ---- onMessage')
  if (message.action === 'fromContent') {
    messageCreate(message.message)
  }
  if (message.action === 'pushTask') {
    console.log('pushTask---background.js 接收', message)
    // 获取所有tab页签
    chrome.tabs.query({}, function (tabs) {
      console.log(tabs, '获取所有tab页签-tabs')
      // 遍历所有页签,如果有douyinHomePage,则激活，没有则创建并激活
      let isExist = false
      tabs.forEach(async (tab) => {
        if (tab.url === douyinHomePage) {
          isExist = true
          douyinTabId = tab.id
          console.log('存在抖音创作页签', tab)
          // 放入缓存
          chrome.storage.local.set({ douyinTabId: tab.id })
          // 激活tab
          chrome.tabs.update(tab.id, { active: true })
          await injectContentScript(douyinTabId)
          // 1s后向content-script发送消息
          sendMessageToContentScript(
            { action: 'pushTask', message: message.message },
            callback,
            douyinTabId
          )
        }
      })
      if (!isExist) {
        messageCreate('不存在抖音创作页签，即将打开')
        chrome.tabs.create({ url: douyinHomePage })
      }
    })
  }

  if (message.action === 'getDouyinTabId') {
    getDouyinTabId().then((res) => {
      console.log(res, 'getDouyinTabId')
      douyinTabId = res
    })
  }
})

// 获取缓存的douyinTabId
async function getDouyinTabId() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('douyinTabId', (result) => {
      resolve(result.douyinTabId)
    })
  })
}

// 获取当前tab
async function getCurrentTab() {
  try {
    let queryOptions = { active: true, lastFocusedWindow: true }
    let [tab] = await chrome.tabs.query(queryOptions)
    return tab
  } catch (error) {
    console.error('Error getting current tab:', error)
  }
}

// 向content-script主动发送消息
async function sendMessageToContentScript(message, callback, tabId = null) {
  try {
    if (!tabId) {
      const tab = await getCurrentTab()
      if (!tab || !tab.id) {
        console.error('No active tab found.')
        return
      }
      tabId = tab.id
    }

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message)
      }
      if (callback) callback(response)
    })
  } catch (error) {
    console.error('Error sending message to content script:', error)
  }
}

// 创建通知
function messageCreate(message) {
  //创建一个通知面板
  chrome.notifications.create(Math.random() + '', {
    type: 'basic',
    iconUrl: 'images/icon_32.png',
    title: '自动化插件',
    message: message
  })
}
