
document.addEventListener('DOMContentLoaded', async function () {
  console.log('DOMContentLoaded 页面加载完成！');
});

// 接收来自后台的消息
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log('收到来自 ' + (sender.tab ? "content-script(" + sender.tab.url + ")" : "popup或者background") + ' 的消息：', request);

  for (const key in request) {
    if (request.hasOwnProperty(key)) {
      const element = request[key];
      localStorage.setItem(key, element);
    }
  }
  sendResponse('我收到你的消息了：' + JSON.stringify(request));
  var action = request['action'];
  console.log('action', action);

  switch (action) {
    case 'sync': getTableAll()
      break;
    case 'start': goToChildPage()
      break;
    case 'reload': reloadTable()
      break;
    case 'logout': childLogout()
      break;
    default:
      break;
  }
});


async function reloadTable() {
  try {
    // 获取最大页码
    getMaxPage();
    // 如果不是最后一页，轮流跳转到最后一页
    while (currentPage < maxPage) {
      nextPage();
      await delay(1000);
    }
    // 如果是最后一页，再次获取最大页码
    getMaxPage();
    // 如果不是第一页，轮流跳转到第一页
    while (currentPage > 1) {
      prevPage();
      await delay(1000);
    }
    // 如果是第一页，再次获取最大页码
    getMaxPage();
    // 10秒后重新获取表格数据
    await delay(90 * 1000);
    reloadTable();
  } catch (error) {
    handleError(error)
  }
}







// 账号列表
const accountList = []
// 
const pageFlag = true
// 是否需要获取数据
let isNeedGetData = true
// 创建一个空数组来保存收集到的数据
const dataList = [];
// 记录当前页数
let currentPage = 1;
// 记录最大页数
let maxPage = 1;
// 重试次数
let retryCount = 0;
// 最大重试次数
const maxRetryCount = 5;

const fileName = 'file.mp4'; // 指定文件名
const mimeType = 'video/mp4'; // 指定 MIME 类型
// 文件编号
const fileNo = 'VIDEO240702112'
// 文件路径
let filePath = ''
// 发布按钮
let publishButton = null;


// 获取当前页面的表格数据
async function getTableAll() {
  try {
    // 获取表格的tbody元素
    const tbody = document.querySelector('.douyin-creator-pc-table-tbody');

    if (tbody) {
      // 获取所有的tr元素
      const rows = tbody.querySelectorAll('tr');

      // 遍历所有的tr元素
      rows.forEach(row => {
        // 创建一个空对象来保存每行的数据
        const rowData = {};

        // 获取当前行的所有td元素
        const cells = row.querySelectorAll('td');

        // 获取每个td中的数据，并存储到rowData对象中
        rowData.avatar = cells[0].querySelector('img').src;
        rowData.name = cells[0].querySelector('p').textContent.trim();
        rowData.id = cells[1].textContent.trim();
        rowData.date = cells[2].textContent.trim();
        rowData.management = cells[3].textContent.trim();
        rowData.actions = Array.from(cells[4].querySelectorAll('span')).map(span => span.textContent.trim());

        // 将rowData对象添加到dataList数组中
        dataList.push(rowData);
      });

      // 打印收集到的数据
      console.log(dataList);

      // 获取最大页码
      getMaxPage();

      // 递归调用获取下一页数据
      if (currentPage < maxPage) {
        await nextPage();
        await getTableAll();
      } else {
        console.log('所有页面的数据已获取完毕');
      }
    } else {
      throw new Error('未找到表格的tbody元素');
    }

  } catch (error) {
    handleError(error);
    // 重新获取table
    await delay(1000);
    retryCount++;

    if (retryCount < maxRetryCount) {
      await getTableAll();
    } else {
      console.error('重试次数已达上限');
    }
  }
}

async function getTable() {
  accountList.length = 0
  try {
    // 获取表格的tbody元素
    const tbody = document.querySelector('.douyin-creator-pc-table-tbody');

    // 获取所有的tr元素
    const rows = tbody.querySelectorAll('tr');

    // 遍历所有的tr元素
    rows.forEach((row, col) => {
      // 创建一个空对象来保存每行的数据
      const rowData = {};

      // 获取当前行的所有td元素
      const cells = row.querySelectorAll('td');

      // 获取每个td中的数据，并存储到rowData对象中
      rowData.avatar = cells[0].querySelector('img').src;
      rowData.name = cells[0].querySelector('p').textContent.trim();
      rowData.id = cells[1].textContent.trim();
      rowData.date = cells[2].textContent.trim();
      rowData.management = cells[3].textContent.trim();
      rowData.actions = Array.from(cells[4].querySelectorAll('span'))
      rowData.sort = col

      // 将rowData对象添加到dataList数组中
      accountList.push(rowData);
    });

    // 打印收集到的数据
    console.log(accountList, 'accountList');


  } catch (error) {
    handleError(error)
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
  const pageDiv = document.querySelector('.douyin-creator-pc-page-item.douyin-creator-pc-page-item-small');

  if (pageDiv) {
    // 获取div的文本内容
    const pageText = pageDiv.innerText.trim();
    currentPage = Number(pageText.split('/')[0]);
    maxPage = Number(pageText.split('/')[1]);
    console.log('currentPage', currentPage);
    console.log('maxPage', maxPage);
  } else {
    console.log('未找到目标div元素');
  }
}

// 点击上一页
async function prevPage() {
  // 如果当前页数不是1，就点击上一页
  if (currentPage > 1) {
    const prevPageButton = document.querySelector('.douyin-creator-pc-page-item.douyin-creator-pc-page-prev');
    if (prevPageButton) {
      prevPageButton.click();
      console.log('prevPageButton clicked');
      await delay(1000);  // 等待页面加载完成
      getMaxPage();       // 更新当前页码
    } else {
      console.error('prevPageButton not found');
    }
  } else {
    console.log('已经是第一页');
  }
}

// 点击下一页
async function nextPage() {
  if (currentPage < maxPage) {
    const nextPageButton = document.querySelector('.douyin-creator-pc-page-item.douyin-creator-pc-page-next');
    if (nextPageButton) {
      nextPageButton.click();
      console.log('nextPageButton clicked');
      await delay(1000);  // 等待页面加载完成
      getMaxPage();       // 更新当前页码
    } else {
      console.error('nextPageButton not found');
    }
  } else {
    console.log('已经是最后一页');
  }
  await delay(1000); // 等待页面加载
}

// 跳转到某一页
function goToPage(page) {
  return new Promise(async (resolve, reject) => {
    getMaxPage();
    page = Number(page);
    if (page < 1 || page > maxPage) {
      console.error('页码超出范围');
      reject('页码超出范围');
      return;
    }

    while (currentPage !== page) {
      if (page < currentPage) {
        await prevPage();
      } else if (page > currentPage) {
        await nextPage();
      }
    }

    console.log(`已经跳转到第${page}页`);
    resolve(page);
  });
}



// 子账号的索引
const childIndex = 12
const ID = '42510800572'

// 点击管理跳转子账号页面
async function goToChildPage() {

  // 先判断childIndex在第几页
  const pageIndex = Math.ceil(childIndex / 5)

  // 进入对应页码
  await goToPage(pageIndex)
  // 获取当前页面的table
  getTable()
  if (accountList && accountList.length) {
    // 获取accountList中id为ID的元素
    const childAccount = accountList.find(item => item.id === ID)
    // 获取子页面上导航栏
    childAccount.actions[0].click()
  }
}


const clickIndex = 1
// 获取子页面上导航栏
async function getNavigationList() {

  try {
    const navList = document.querySelector('.semi-navigation-list');

    // 找到navList中的所有li元素
    const navListItems = navList.querySelectorAll('li')[clickIndex]
    console.log('navListItems', navListItems);
    if (navListItems) {
      navListItems.click()
      console.log('navListItems clicked');

      // TODO: 点击上传按钮
      // sendPostRequest()
    }
  } catch (error) {
    handleError(error)
    // 重新获取table
    await delay(1 * 1000)
    getNavigationList()
  }

}



// 通过接口获取文件路径
function sendPostRequest() {
  const url = 'https://bj.devwwd.site:449/dev-api/videoclip/admin/videofileauto/getFileByFileNo?fileNo=' + fileNo;
  console.log('接口请求开始');
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      console.log(data, '接口请求返回的data');
      if (data.code === 200) {
        filePath = data.data.filePath
        toUpload();
      }
    })
    .catch(error => {
      console.error('Fetch Error:', error);
    });
}

// 获取上传按钮
function toUpload() {

  urlToFile(filePath, fileName, mimeType)
    .then(async (file) => {
      console.log('File object created:', file);

      // 这里你可以将 File 对象赋值给文件输入元素

      const inputElement = document.querySelectorAll('input[type="file"][name="upload-btn"]')[0];
      console.log('inputElement', inputElement);
      if (inputElement) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        inputElement.files = dataTransfer.files;

        // 触发 change 事件以确保上传组件检测到文件
        const event = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(event);

        console.log('File uploaded successfully');
        await delay(4 * 1000)
        checkUploadVideo();


      } else {
        console.error('Upload input element not found');
      }
    })
    .catch((error) => {
      console.error('Error creating File object:', error);
    });

}





function checkUploadVideo() {
  const videoElement = document.querySelector('video');
  console.log('videoElement', videoElement);

  if (videoElement) {
    // 检查视频是否已经加载好
    if (videoElement.readyState >= 3) {
      console.log('videoElement already loaded');
      handleVideoLoad(videoElement);
    } else {
      console.log('videoElement not yet loaded, adding event listener');
      videoElement.addEventListener('loadeddata', () => {
        console.log('videoElement loadeddata');
        handleVideoLoad(videoElement);
      });
    }
  } else {
    // 如果视频元素不存在，输出错误信息,并继续调用checkUploadVideo
    console.error('videoElement not found');
    setTimeout(checkUploadVideo, 1000);
  }
}

async function handleVideoLoad(_videoElement) {  // 找到页面card-container-creator-layout下的按钮文案内容为发布的按钮 并点击
  const publishButtons = document.querySelectorAll('button');
  console.log('publishButtons', publishButtons);


  // 遍历按钮，查找内容为 "发布" 的按钮
  publishButtons.forEach(button => {
    if (button.textContent.trim() === '发布') {
      publishButton = button;
    }
  });

  if (publishButton) {
    console.log('找到发布按钮:', publishButton);

    publishButton.click();

    await delay(4 * 1000)
    childLogout()

  } else {
    console.log('未找到发布按钮');
  }

}

// 退出登录
async function childLogout() {

  // 找到页面card-container-creator-layout下的按钮文案内容为发布的按钮 并点击
  const logoutButton = document.querySelector('.semi-navigation-footer .semi-avatar');

  console.log('logoutButton', logoutButton);
  if (logoutButton) {
    // 获取按钮的具体位置
    const logoutButtonRect = logoutButton.getBoundingClientRect();
    console.log('logoutButtonRect', logoutButtonRect);
    simulateMouseMove(logoutButtonRect.x + (logoutButtonRect.width / 2), logoutButtonRect.y + (logoutButtonRect.height / 2));
    console.log('logoutButton clicked');
    logout()
  } else {
    console.error('logoutButton not found');
  }
}

// 获取退出按钮的元素
async function logout() {
  await delay(2 * 1000)
  const portalButton = document.querySelector('.semi-portal');
  console.log('portalButton', portalButton);
  const logout = portalButton.querySelector('.logout');
  console.log('logout', logout);

  if (logout) {
    logout.click();
    pageFlag = false
    console.log('logout clicked');
  } else {
    console.error('logout not found');
  }
}





// 工具函数 

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 将 OSS URL 转换为 File 对象的函数
async function urlToFile(url, fileName, mimeType) {
  // 使用 fetch 获取文件的 Blob 数据
  const response = await fetch(url);
  const blob = await response.blob();

  // 将 Blob 转换为 File 对象
  return new File([blob], fileName, { type: mimeType });
}

// 模拟鼠标移动到指定坐标
function simulateMouseMove(x, y) {
  // const mouseMoveEvent = new MouseEvent('mousemove', {
  //   view: window,
  //   bubbles: true,
  //   cancelable: true,
  //   clientX: x,
  //   clientY: y
  // });

  const mouseEnterEvent = new MouseEvent('mouseenter', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  });

  const mouseOverEvent = new MouseEvent('mouseover', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x + 3,
    clientY: y + 3
  });


  const targetElement = document.elementFromPoint(x, y);
  console.log(targetElement, 'targetElement');
  if (targetElement) {
    // targetElement.dispatchEvent(mouseMoveEvent);
    targetElement.dispatchEvent(mouseEnterEvent);
    targetElement.dispatchEvent(mouseOverEvent);
    console.log(`Simulated mouse move and enter to: (${x}, ${y})`);
  } else {
    console.error('No element found at the specified coordinates:', x, y);
  }
}


async function getNav() {
  // 获取ul元素
  const ulElement = document.querySelector('.semi-navigation-list');

  // 存储所有id值的数组
  const ids = [];

  // 遍历所有li元素
  const liElements = ulElement.querySelectorAll('li');

  liElements.forEach(li => {
    // 查找span元素并获取id值
    const spanElements = li.querySelectorAll('span[id]');
    spanElements.forEach(span => {
      const idValue = span.getAttribute('id');
      if (idValue) {
        ids.push(idValue);
      }
    });
  });

  // 打印所有id值
  console.log(ids);
}


// 错误处理函数，将错误信息存储在 localStorage 中
function handleError(error) {
  console.log('发生错误:', error);
  const errorLogs = JSON.parse(localStorage.getItem('errorLogs')) || [];
  const errorLog = {
    message: error.message,
    stack: error.stack,
    time: new Date().toISOString()
  };
  errorLogs.push(errorLog);
  localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
}

// // 示例异步函数，包含错误捕获
async function someAsyncFunction() {
  try {
    // 模拟异步操作
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('模拟的错误'));
      }, 1000);
    });
  } catch (error) {
    handleError(error);
    console.error('发生错误:', error);
  }
}

// // 示例调用
// someAsyncFunction();



