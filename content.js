

// 或者你也可以使用 window.onload
window.onload = async () => {

  console.log('Page fully loaded by onload event');
  await delay(10 * 1000)
  console.log('延时4秒后执行getAccountList');
  console.log('window.location.href', window.location.href);
  // 获取页面上账号信息table的数据
  if (window.location.href === 'https://creator.douyin.com/creator-micro/home') {

    getAccountList()
  } if (window.location.href === 'http://58.49.17.106:13276/#/config/videotemplatescript') {

    checkHover()
  }
  else {
    // getNavigationList()
    childLogout()
  }
};

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
  const mouseMoveEvent = new MouseEvent('mousemove', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  });

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
    clientX: x + 2,
    clientY: y + 2
  });


  const targetElement = document.elementFromPoint(x, y);
  console.log(targetElement, 'targetElement');
  if (targetElement) {
    targetElement.dispatchEvent(mouseMoveEvent);
    targetElement.dispatchEvent(mouseEnterEvent);
    targetElement.dispatchEvent(mouseOverEvent);
    console.log(`Simulated mouse move and enter to: (${x}, ${y})`);
  } else {
    console.error('No element found at the specified coordinates:', x, y);
  }
}

// 账号列表
const accountList = []
// 获取页面上账号信息table的数据
async function getAccountList() {
  // class 为 douyin-creator-pc-table的table
  const table = document.querySelector('.douyin-creator-pc-table');

  // 获取特定的span元素
  const manageSpan = table.querySelectorAll('tr[role="row"] td:last-child span._Ji1e:first-child');

  accountList.push(manageSpan)
  if (accountList && accountList.length) {
    console.log('accountList', accountList);
    // 点击第一个账号的管理按钮
    manageSpan[0].click();

    await delay(6 * 1000)

    getNavigationList()
  }

}

// 获取页面上导航栏的数据
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
    // sendPostRequest()
  }

}

const fileName = 'file.mp4'; // 指定文件名
const mimeType = 'video/mp4'; // 指定 MIME 类型
// 文件编号
const fileNo = 'VIDEO240702112'
// 文件路径
let filePath = ''

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
        getUploadInput();
      }
    })
    .catch(error => {
      console.error('Fetch Error:', error);
    });
}

// 获取上传按钮
function getUploadInput() {

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

let publishButton = null;
// // 点击发布按钮
// function clickPublish() {
//   // 找到页面card-container-creator-layout下的按钮文案内容为发布的按钮 并点击
//   const publishButtons = document.querySelectorAll('button');
//   console.log('publishButtons', publishButtons);


//   // 遍历按钮，查找内容为 "发布" 的按钮
//   publishButtons.forEach(button => {
//     if (button.textContent.trim() === '发布') {
//       publishButton = button;
//     }
//   });

//   if (publishButton) {
//     console.log('找到发布按钮:', publishButton);
//     checkUploadVideo();

//   } else {
//     console.log('未找到发布按钮');
//   }
// }

// // 找到页面的video元素并监听加载事件，等待加载完成点击发布按钮
// function checkUploadVideo() {
//   const videoElement = document.querySelectorAll('video')[0];
//   console.log('videoElement', videoElement);
//   if (videoElement) {
//     console.log('videoElement loaded');
//     videoElement.addEventListener('loadeddata', () => {
//       console.log('videoElement loadeddata');
//       if (publishButton) {
//         publishButton.click();
//         console.log('publishButton clicked');
//       }
//     }
//     );
//   } else {
//     console.error('videoElement not found');
//   }
// }


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

function handleVideoLoad(_videoElement) {  // 找到页面card-container-creator-layout下的按钮文案内容为发布的按钮 并点击
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

    // publishButton.click();

  } else {
    console.log('未找到发布按钮');
  }

}

// 退出登录
// 退出登录
function childLogout() {

  // 找到页面card-container-creator-layout下的按钮文案内容为发布的按钮 并点击
  const logoutButton = document.querySelector('.semi-navigation-footer .semi-avatar');

  console.log('logoutButton', logoutButton);
  if (logoutButton) {

    // 获取按钮的具体位置
    const logoutButtonRect = logoutButton.getBoundingClientRect();
    console.log('logoutButtonRect', logoutButtonRect);
    simulateMouseMove(logoutButtonRect.x + (logoutButtonRect.width / 2), logoutButtonRect.y + (logoutButtonRect.height / 2));
    logoutButton.click();
    console.log('logoutButton clicked');
    getLogoutButton()
  } else {
    console.error('logoutButton not found');
  }
}

// 获取退出按钮的元素
async function getLogoutButton() {
  await delay(4 * 1000)
  const portalButton = document.querySelector('.semi-portal');
  console.log('portalButton', portalButton);
  const logoutButton = portalButton.querySelector('.logout');
  console.log('logoutButton', logoutButton);
  if (logoutButton) {
    logoutButton.click();
    console.log('logoutButton clicked');
  } else {
    console.error('logoutButton not found');
  }
}



function checkHover() {
  const hoverElement = document.querySelector('.template-card:first-child');
  console.log('hoverElement', hoverElement);
  if (hoverElement) {
    // 模拟鼠标移入
    const hoverElementRect = hoverElement.getBoundingClientRect();
    console.log('hoverElementRect', hoverElementRect);
    simulateMouseMove(hoverElementRect.x + (hoverElementRect.width / 2), hoverElementRect.y + (hoverElementRect.height / 2));

  } else {
    console.error('hoverElement not found');
  }

}




/****** /

// 示例用法
const fileName = 'file.mp4'; // 指定文件名
const mimeType = 'video/mp4'; // 指定 MIME 类型
// 文件编号
const fileNo = 'VIDEO240702112'
// 文件路径
let filePath = ''




function getUploadBtnById() {
  // 通过id获取按钮元素
  // douyin-creator-pc-table-tbody


  const button = document.querySelector('#douyin-creator-master-side-upload');
  console.log('document', document);
  console.log('button', button);
  if (button) {
    button.click();
    console.log('button clicked');

    // 延时2秒后执行getUploadInput
    setTimeout(() => {
      console.log('延时2秒后执行getUploadInput', window.location.href);
      sendPostRequest()
    }, 4000);

  } else {
    console.error('Button not found');
  }
}









// 找到class 为 editor-kit-editor-container 下的input输入框
function findInput() {
  const inputElement = document.querySelectorAll('.editor-kit-editor-container input')[0]
  console.log('inputElement', inputElement);
  if (inputElement) {
    // 给输入框填入内容
    inputElement.value = 'Hello World';
    console.log('inputElement Hello World');
  } else {
    console.error('inputElement not found');
  }
}




// 检查上传的视频文件在页面是否加载完毕
function checkUploadVideo() {
  findInput();
  const videoElement = document.querySelectorAll('video')[0];
  console.log('videoElement', videoElement);
  if (videoElement) {
    console.log('videoElement loaded');

  } else {
    console.error('videoElement not found');
  }
}




*/

