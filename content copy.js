
document.addEventListener('DOMContentLoaded', async function () {
  console.log('DOMContentLoaded 页面加载完成！');
});

// 接收来自后台的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
    case 'sync': getTable()

      break;
    case 'start': goToChildPage()

      break;

    case 'logout': childLogout()

    default:
      break;
  }

});








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
async function getTable() {
  console.log('DOMContentLoaded 页面加载完成！');

  try {
    // 获取表格的tbody元素
    const tbody = document.querySelector('.douyin-creator-pc-table-tbody');

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
    getMaxPage()
    await delay(1 * 1000)
    nextPage()


  } catch (error) {
    console.error('Error:', error);
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
  // 使用选择器找到目标div元素
  const pageDiv = document.querySelector('.douyin-creator-pc-page-item.douyin-creator-pc-page-item-small');

  if (pageDiv) {
    // 获取div的文本内容
    const pageText = pageDiv.innerText.trim();
    console.log(`页码文本: ${pageText}`);
    currentPage = pageText.split('/')[0]
    console.log('currentPage', currentPage);
    maxPage = pageText.split('/')[1]
    console.log('maxPage', maxPage);

  } else {
    console.log('未找到目标div元素');
  }
}

// 点击上一页
async function prevPage() {
  getMaxPage()
  // 如果当前页数不是1，就点击上一页
  if (currentPage > 1) {
    // 找到按钮文案内容为"发布"的按钮并点击
    const prevPageButton = document.querySelector('.douyin-creator-pc-page-item.douyin-creator-pc-page-prev');
    if (prevPageButton) {
      prevPageButton.click();
      console.log('prevPageButton clicked');
      // getMaxPage()
      // await delay(1 * 1000)
      // prevPage()
    } else {
      console.error('prevPageButton not found');
    }
  } else {
    console.log('已经是第一页');
  }
}

// 点击下一页
async function nextPage(page) {
  getMaxPage()
  if (currentPage * 1 < maxPage * 1) {
    // 找到页面card-container-creator-layout下的按钮文案内容为发布的按钮 并点击
    const nextPageButton = document.querySelector('.douyin-creator-pc-page-item.douyin-creator-pc-page-next');
    console.log('nextPageButton', nextPageButton);
    if (nextPageButton) {
      nextPageButton.click();
      // getMaxPage()
      console.log('nextPageButton clicked');
      // await delay(1 * 1000)
      // getTable()
    } else {
      console.error('nextPageButton not found');
    }
  } else {
    isNeedGetData = false
    console.log('已经是最后一页');

    await delay(1 * 1000)

    // TODO: 暂时跳回去
    // prevPage()
    // TODO: 跳转到子账号页面
    // goToChildPage()
  }
}

// 跳转到某一页
async function goToPage(page) {

  // 如果传入的页码小于当前页码，就点击上一页
  if (page < currentPage) {
    await prevPage();
    goToPage(page)
  }
  // 如果传入的页码大于当前页码，就点击下一页
  else if (page > currentPage) {
    await nextPage();
    goToPage(page)
  } else {
    console.log('已经是当前页');
    return true
  }
}

// 子账号的索引
const childIndex = 12

// 点击管理跳转子账号页面
async function goToChildPage() {

  // 先判断childIndex在第几页
  const pageIndex = Math.ceil(childIndex / 5)
  console.log('当前账号的pageIndex = ', pageIndex);
  goToPage(pageIndex)
  // 跳转去第几页
  // goToPage(pageIndex)
  // getMaxPage()
  // // 如果到了当前页，则开始跳转子页面
  // if (currentPage * 1 === pageIndex * 1) {
  //   // class 为 douyin-creator-pc-table的table
  //   const table = document.querySelector('.douyin-creator-pc-table');

  //   // 获取特定的span元素
  //   const manageSpan = table.querySelectorAll('tr[role="row"] td:last-child span._Ji1e:first-child');

  //   accountList.push(manageSpan)
  //   if (accountList && accountList.length) {
  //     // 点击第一个账号的管理按钮
  //     manageSpan[0].click();

  //     await delay(4 * 1000)
  //     // 获取子页面上导航栏
  //     // getNavigationList()
  //   }
  // } else {
  //   console.log('未到达当前页');
  //   goToChildPage()
  // }


}

// 获取子页面上导航栏
async function getNavigationList() {

  // class 为 douyin-creator-pc-table的table
  const navList = document.querySelector('.semi-navigation-list');

  const clickIndex = 1
  // 找到navList中的所有li元素
  const navListItems = navList.querySelectorAll('li')[clickIndex]
  console.log('navListItems', navListItems);
  if (navListItems) {
    navListItems.click()
    console.log('navListItems clicked');
    await delay(2 * 1000)
    // TODO: 点击上传按钮
    sendPostRequest()
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

// 延迟函数，传入时间参数
function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
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




