chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  console.log('onInstalled', reason);
  const tab = await getCurrentTab();
  console.log(tab, '当前tab');
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

chrome.runtime.onMessage.addListener((message, callback) => {
  console.log(message, 'background.js ---- onMessage');
  if (message.action === 'fromContent') {
    messageCreate(message.message)
  }
});

// 获取当前tab 
async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

// 向content-script主动发送消息
function sendMessageToContentScript(message, callback) {
  getCurrentTabId((tabId) => {
    chrome.tabs.sendMessage(tabId, message, function (response) {
      if (callback) callback(response);
    });
  });
}


// 创建通知
function messageCreate(message) {
  //创建一个通知面板
  chrome.notifications.create(
    Math.random() + '',
    {
      type: 'basic',
      iconUrl: 'images/icon_32.png',
      title: '自动化插件',
      message: message
    }
  );
}
