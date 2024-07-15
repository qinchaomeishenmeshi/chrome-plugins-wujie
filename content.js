

/**
 * @description: 抖音创作中心自动化脚本，用于自动填写表单并发布视频
 * 同步账号
 * 获取任务
 * 上传视频
 * 发布视频
 * 修改任务状态
 * 退出登录
 * */
// 子账号首页
const childHomePage = 'https://creator.douyin.com/'
// 子账号内容管理页码
const childContentPage = 'https://creator.douyin.com/content/manage'
// 子账号上传页面
const childUploadPage = 'https://creator.douyin.com/content/'
// 子账号发布页面
const childPublishPage = 'https://creator.douyin.com/content/publish?enter_from=publish_page'
// 发布后的页面
const childPublishAfterPage = 'https://creator.douyin.com/content/manage?enter_from=publish'


function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', () => {
        resolve();
      });
    }
  });
}

async function init() {
  await waitForPageLoad();
  console.warn('页面加载成功。。。');
  switch (window.location.href) {
    case childHomePage:
      // 点击内容管理按钮
      getNavigationList()

      break;
    case childUploadPage:
      // 重新设置缓存标志位
      localStorage.setItem('isResetCache', '0')
      // 进入子页面先清空历史缓存数据
      await removeStorageKey()
      console.log('清空历史缓存数据');
      //  点击上传按钮
      getUploadFileFn()

      break;

    case childContentPage:
      // 退出代运营状态
      childLogout()
      break

    case childPublishPage:
      // 点击发布按钮
      handleInputCache()
      break

    default:
      break;
  }
}

init();



// 接收来自后台的消息
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
  console.log('action', action)

  switch (action) {
    case 'sync':
      getTableAll()
      break
    case 'start':
      getTask()
      break
    case 'reload':
      reloadTable()
      break
    case 'logout':
      childLogout()
      break
    default:
      break
  }
})

async function reloadTable() {
  try {
    // 获取最大页码
    getMaxPage()
    // 如果不是最后一页，轮流跳转到最后一页
    while (currentPage < maxPage) {
      nextPage()
      await delay(1000)
    }
    // 如果是最后一页，再次获取最大页码
    getMaxPage()
    // 如果不是第一页，轮流跳转到第一页
    while (currentPage > 1) {
      prevPage()
      await delay(1000)
    }
    // 如果是第一页，再次获取最大页码
    getMaxPage()
    // 10秒后重新获取表格数据
    await delay(90 * 1000)
    reloadTable()
  } catch (error) {
    $handleError(error)
  }
}

// 账号列表
const accountList = []
//
const pageFlag = true
// 是否需要获取数据
let isNeedGetData = true
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

// 文件编号
const fileNo = 'VIDEO240702112'


// 发布按钮
let publishButton = null

// 获取当前页面的表格数据
async function getTableAll() {
  try {
    // 获取表格的tbody元素
    const tbody = document.querySelector('.douyin-creator-pc-table-tbody')

    if (tbody) {
      // 获取所有的tr元素
      const rows = tbody.querySelectorAll('tr')

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
      getMaxPage()

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
    await delay(1000)
    retryCount++

    if (retryCount < maxRetryCount) {
      await getTableAll()
    } else {
      console.error('重试次数已达上限')
    }
  }
}

async function syncAccount() {
  try {

    // 调用接口传递给后台
    const res = await $Request('/admin/juzhensubaccount/accountManage', {
      params: dataList
    })
    localStorage.setItem('dataList', JSON.stringify(dataList))
    console.log(res, '同步账号接口---res')
  } catch (error) {
    $handleError(error)
  }
}

async function getTable() {
  accountList.length = 0
  try {
    // 获取表格的tbody元素
    const tbody = document.querySelector('.douyin-creator-pc-table-tbody')

    // 获取所有的tr元素
    const rows = tbody.querySelectorAll('tr')

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
  } catch (error) {
    $handleError(error)
    // 重新获取table
    await delay(1 * 1000)
    retryCount++

    if (retryCount < maxRetryCount) {
      getTable()
    }
  }
}

// 获取最大页码数
function getMaxPage() {
  // 获取分页器的元素
  const pageDiv = document.querySelector(
    '.douyin-creator-pc-page-item.douyin-creator-pc-page-item-small'
  )

  if (pageDiv) {
    // 获取div的文本内容
    const pageText = pageDiv.innerText.trim()
    currentPage = Number(pageText.split('/')[0])
    maxPage = Number(pageText.split('/')[1])
    console.log('currentPage', currentPage)
    console.log('maxPage', maxPage)
  } else {
    console.log('未找到目标div元素')
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
      await delay(1000) // 等待页面加载完成
      getMaxPage() // 更新当前页码
    } else {
      console.error('prevPageButton not found')
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
      await delay(1000) // 等待页面加载完成
      getMaxPage() // 更新当前页码
    } else {
      console.error('nextPageButton not found')
    }
  } else {
    console.log('已经是最后一页')
  }
  await delay(1000) // 等待页面加载
}

// 跳转到某一页
function goToPage(page) {
  return new Promise(async (resolve, reject) => {
    getMaxPage()
    page = Number(page)
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
  console.log(childIndex, 'childIndex');
  // 先判断childIndex在第几页
  if (childIndex === -1) {
    console.log(' 子账号没找到 ');
    return
  }
  // 每页5个元素，计算元素所在的页码
  const itemsPerPage = 5;
  const pageIndex = Math.ceil((childIndex + 1) / itemsPerPage); // 使用 (childIndex + 1) 确保正确的页码计算

  // 进入对应页码
  await goToPage(pageIndex)

  // 获取当前页面的table
  getTable()
  if (accountList && accountList.length) {
    // 获取accountList中id为ID的元素
    const childAccount = accountList.find((item) => item.dyAccountNo === task.dyUserId)
    console.log(childAccount, 'childAccount');
    // 获取子页面上导航栏
    childAccount?.actions[0].click()
  }
}

// 获取要开始的任务
async function getTask() {
  try {
    const api = '/admin/autopublishtask/getNoPublicData'
    const res = await $Request(api)
    if (!res) {
      messageCreate('没有新的任务')
      return
    }
    localStorage.setItem('task', JSON.stringify(res))
    // 进入子账号页面
    goToChildPage()
  } catch (error) {
    $handleError(error)
  }
}

// 获取子页面上导航栏
async function getNavigationList() {
  try {
    // 找到navList中的所有li元素
    const navListItems = await waitForElement('.semi-navigation-list li', { isAll: true })
    console.log(navListItems)
    if (navListItems && navListItems.length) {
      navListItems[1].click()
      console.log('navListItems clicked')
    }

  } catch (error) {
    $handleError(error)
  }
}


// 通过接口获取文件路径
async function getUploadFileFn() {
  // 获取任务数据
  const task = parseJSON(localStorage.getItem('task'), {})
  const { filePath, taskName } = task

  try {

    const file = await urlToFile(filePath, taskName)
    // 获取上传按钮，并将file上传
    const inputElement = await waitForElement('input[type="file"][name="upload-btn"]', { isAll: true })
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
      console.error('Upload input element not found')
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
      console.error('videoElement not found')
      await delay(2 * 1000)
      checkUploadVideo()
    }
  } catch (error) {
    $handleError(error)
  }
}

// 视频加载完毕后写入缓存准备发布
async function handleInputCache(_videoElement) {
  try {
    // 检查是否需要重新写入缓存
    const cacheFlag = localStorage.getItem('isResetCache');
    console.log(cacheFlag, 'cacheFlag');

    if (cacheFlag !== '1') {

      const flag = await autoFillForm();
      if (flag) {
        reloadPage()
      } else {
        console.log('表单自动填写失败');
      }
    } else {
      // 已经填写过表单，进行发布操作
      console.log('表单已自动填写，进行发布操作');
      const publishButton = await findPublishButton();

      if (publishButton) {
        publishSuccess()
        console.log('点击发布按钮');

        publishButton.click();


        // 点击发布按钮后，进入内容管理页面
        // window.location.href = childContentPage;
      } else {
        console.error('未找到发布按钮');
      }
    }
  } catch (error) {
    console.error('表单自动填写过程中出现错误:', error);
  }
}

// 查找并返回发布按钮
async function findPublishButton() {
  const publishButtons = await waitForElement('button', { isAll: true });
  // 遍历按钮，查找内容为 "发布" 的按钮
  for (const button of publishButtons) {
    if (button.textContent.trim() === '发布') {
      return button;
    }
  }
  return null;
}


// 自动填充表单，写入缓存后刷新一次页面，如果再次进入则不再填充
async function autoFillForm() {
  return new Promise(async (resolve, reject) => {
    let flag = false;
    try {
      // 获取任务数据
      const task = parseJSON(localStorage.getItem('task'), {})

      // 获取缓存数据
      const cacheList = await getStorageKey()
      // 
      if (cacheList && cacheList.length) {
        console.log('获取缓存list', cacheList);
        cacheList.forEach(item => {
          const cacheItem = localStorage.getItem(item)
          if (!cacheItem || cacheItem === 'null' || cacheItem === 'undefined') {
            return
          }
          // 获取缓存数据
          const { type, cache } = parseJSON(cacheItem, {})
          // 重新赋值 cache 数据
          const newCacheData = {
            ...cache,
            itemTitle: task.taskName,
            textResult: {
              text: task.remark,
              textExtra: [],
              activity: [],
              caption: task.remark
            }
          };
          const newData = JSON.stringify({ type, cache: newCacheData });
          localStorage.setItem(item, newData);
        })
      } else {
        console.log('没有找到缓存');
        return
      }
      // 设置标志位，表明已经填写过表单
      console.log('表单自动填写成功');
      localStorage.setItem('isResetCache', '1');
      flag = true;
      resolve(flag); // 返回成功标志
    } catch (error) {
      console.error('autoFillForm 出现错误:', error);
      reject(error); // 返回错误信息
    }
  });
}

// 发布成功后通知后台
async function publishSuccess() {
  try {
    // 获取任务数据
    const task = parseJSON(localStorage.getItem('task'), {})
    const { id, filePath } = task;
    const api = '/admin/autopublishtask/updateAutoPublishTask'
    const res = await $Request(api, {
      params: {
        id: id, dyVideoUrl: filePath
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
    await delay(2000); // 等待页面加载

    const logoutButton = await waitForElement('.semi-navigation-footer .semi-avatar');
    // 获取按钮的具体位置
    const logoutButtonRect = logoutButton.getBoundingClientRect();
    simulateMouseMove(
      logoutButtonRect.x + logoutButtonRect.width / 2,
      logoutButtonRect.y + logoutButtonRect.height / 2
    );
    console.log('logoutButton clicked');

    await delay(2000); // 等待下拉菜单出现
    const logout = await waitForElement('.semi-portal .logout');
    console.log(logout);

    if (logout) {
      logout.click();
      pageFlag = false;
      console.log('logout clicked');
    } else {
      await delay(2000);
      childLogout();
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
}


// 工具函数
// 等待元素出现，没有出现就2秒后重试
async function waitForElement(selector, options = {}) {
  const querySelectorAll = options.isAll || false;
  const timeout = options.timeout || 10000; // 每次尝试的超时时间
  const interval = options.interval || 500; // 检查间隔
  const retryDelay = options.retryDelay || 2000; // 每次重试之间的等待时间
  const maxRetries = options.maxRetries || 5; // 最大重试次数

  let retries = 0;

  while (retries < maxRetries) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = querySelectorAll ? document.querySelectorAll(selector) : document.querySelector(selector);
      if (element && (querySelectorAll ? element.length > 0 : true)) {
        return element;
      }
      await delay(interval);
    }
    // 如果达到这里，说明本次尝试超时
    console.log(`Attempt ${retries + 1} failed. Retrying after ${retryDelay}ms...`);
    await delay(retryDelay);
    retries++;
  }

  throw new Error(`Element not found after ${maxRetries} retries: ${selector}`);
}


// 模拟鼠标移动的函数
function simulateMouseMove(x, y) {
  const event = new MouseEvent('mousemove', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  });
  document.dispatchEvent(event);
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
  }
}



// // TODO: 暂时用内部的，后续需要改成外部的request.js

// 通用的调用接口方法
function $Request(url = '', { options = {}, params = {} } = {}) {
  const baseURL = 'https://bj.devwwd.site:449/dev-api/videoclip'
  const requestURL = baseURL + url
  console.log('接口请求开始');

  return new Promise((resolve, reject) => {
    fetch(requestURL, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': options.contentType || 'application/json',
      },
      ...(options.method === 'GET' ? {} : { body: JSON.stringify(params) }),

    })
      .then(response => response.json())
      .then(data => {
        console.log(data, '接口请求返回的data');
        if (data.code === 200) {
          resolve(data.data);
        } else {
          reject(new Error(`接口返回错误: ${data.message}`));
        }
      })
      .catch(error => {
        console.error('Fetch Error:', error);
        reject(error);
      });
  });
}

// 错误处理函数，将错误信息存储在 localStorage 中
function $handleError(error) {
  console.log('发生错误:', error)
  const errorLogs = parseJSON(localStorage.getItem('errorLogs'), [])
  const errorLog = {
    message: error.message,
    stack: error.stack,
    time: new Date().toISOString()
  }
  errorLogs.push(errorLog)
  localStorage.setItem('errorLogs', JSON.stringify(errorLogs))
}

function removeStorageKey() {
  return new Promise((resolve, reject) => {
    // 定义要查找的前缀
    const prefix = 'publish_form_cache:';
    // 遍历 localStorage 中的所有键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // 检查键是否以指定前缀开头
      if (key.includes(prefix)) {
        console.log('key----' + key);
        // 获取该键的值
        const cachedData = localStorage.getItem(key);
        // 检查键是否存在
        if (cachedData) {
          // 删除指定的键
          localStorage.removeItem(cachedData);
          resolve('已删除指定的键');
        } else {
          reject(new Error('未找到指定的键'));
        }
      }
    }
  });
}

function getStorageKey() {
  return new Promise((resolve, reject) => {
    // 定义要查找的前缀
    const prefix = 'publish_form_cache:';
    const cachedDataList = [];

    // 遍历 localStorage 中的所有键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // 检查键是否以指定前缀开头
      if (key.includes(prefix)) {
        console.log('key----' + key);

        // 获取该键的值
        const cachedData = localStorage.getItem(key);
        console.log('找到的数据:', parseJSON(cachedData, []));
        // 将数据添加到结果列表中
        cachedDataList.push(key);


      }
    }

    // 检查是否找到了匹配的数据
    if (cachedDataList.length > 0) {
      resolve(cachedDataList);
    } else {
      reject(new Error('未找到匹配的键'));
    }
  });
}

async function reloadPage(timeout = 4000) {
  await delay(timeout);
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
  chrome.runtime.sendMessage({ action: "fromContent", message });
}






