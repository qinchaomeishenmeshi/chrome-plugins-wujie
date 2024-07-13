chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log('onInstalled', reason);
  const tab = getCurrentTab();
  console.log(tab, '当前tab');
});

// chrome.runtime.onMessage.addListener((message, callback) => {
//   const tabId = getForegroundTabId();
//   if (message.data === "setAlarm") {
//     chrome.alarms.create({delayInMinutes: 5})
//   } else if (message.data === "runLogic") {
//     chrome.scripting.executeScript({file: 'logic.js', tabId});
//   } else if (message.data === "changeColor") {
//     chrome.scripting.executeScript(
//         {func: () => document.body.style.backgroundColor="orange", tabId});
//   };
// });


chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

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