function createNotification(message) {
  // 发送系统通知
  chrome.runtime.sendMessage({ action: 'fromContent', message })
  // 发送页面进度通知
  // 创建一个容器
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.width = '100%'
  container.style.top = '0'
  container.style.left = '0'
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
  container.style.color = 'white'
  container.style.padding = '10px'
  container.style.borderRadius = '5px'
  container.style.zIndex = '10000'
  container.style.fontFamily = 'Arial, sans-serif'
  container.style.transition = '.3s'

  // 设置消息内容
  container.innerText = message

  // 添加到文档
  document.body.appendChild(container)

  // 自动移除提示框
  setTimeout(() => {
    container.remove()
  }, 5000) // 3秒后自动移除
}
