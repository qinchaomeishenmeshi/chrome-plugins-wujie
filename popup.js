

document.addEventListener('DOMContentLoaded', function () {
  console.log('Popup.js 页面加载完成！');

  let syncButton = document.getElementById('syncBtn');
  let startButton = document.getElementById('startBtn');
  let logoutButton = document.getElementById('logoutBtn');
  let reloadButton = document.getElementById('reloadBtn');

  // 给按钮添加点击事件，事件名为按钮id + 'Click'
  syncButton.addEventListener('click', syncBtnClick);
  startButton.addEventListener('click', startBtnClick);
  reloadButton.addEventListener('click', reloadBtnClick);
  logoutButton.addEventListener('click', logoutBtnClick)

});

// 同步账号信息
function syncBtnClick() {
  console.log('syncBtnClick');
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'sync' }, function (response) {
      console.log(response);
    });
  });
}

// 开始执行自动化任务
function startBtnClick() {
  console.log('startBtnClick');
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'start' }, function (response) {
      console.log(response);
    });
  });
}

// 保持登陆
function reloadBtnClick() {
  console.log('reloadBtnClick');
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'reload' }, function (response) {
      console.log(response);
    });
  });
}

// 退出代运营状态
function logoutBtnClick() {
  console.log('logoutBtnClick');
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'logout' }, function (response) {
      console.log(response);
    });
  });
}


// 向content-script主动发送消息
function sendMessageToContentScript(message, callback) {
  getCurrentTabId((tabId) => {
    chrome.tabs.sendMessage(tabId, message, function (response) {
      if (callback) callback(response);
    });
  });
}

// 获取当前选项卡ID
function getCurrentTabId(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (callback) callback(tabs.length ? tabs[0].id : null);
  });
}
