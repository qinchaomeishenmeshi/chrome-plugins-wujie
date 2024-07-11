

// 或者你也可以使用 window.onload
window.onload = () => {
  console.log('Page fully loaded by onload event');

  // 延时2秒后执行
  setTimeout(() => {
    getUploadBtnById();
  }, 2000);
};


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


// 获取上传按钮
function getUploadInput() {

  urlToFile(filePath, fileName, mimeType)
    .then((file) => {
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

        checkUploadVideo()

      } else {
        console.error('Upload input element not found');
      }
    })
    .catch((error) => {
      console.error('Error creating File object:', error);
    });

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

// 将 OSS URL 转换为 File 对象的函数
async function urlToFile(url, fileName, mimeType) {
  // 使用 fetch 获取文件的 Blob 数据
  const response = await fetch(url);
  const blob = await response.blob();

  // 将 Blob 转换为 File 对象
  return new File([blob], fileName, { type: mimeType });
}




