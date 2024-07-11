
try {

  console.log(chrome.tabs, 'chrome');
  document.getElementById('getTabInfo').addEventListener('click', () => {
    console.log('getTabInfo clicked');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const tabInfo = `URL: ${activeTab.url}\nTitle: ${activeTab.title}`;
      document.getElementById('tabInfo').innerText = tabInfo;
    });
  });
} catch (error) {

  console.error('Error:', error);
}