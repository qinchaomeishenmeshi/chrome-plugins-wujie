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

// 解析JSON
function parseJSON(jsonString = '', defaultValue = null) {
  // 不可为空，null,undefined
  if (
    !jsonString ||
    jsonString === null ||
    jsonString === undefined ||
    jsonString === 'null' ||
    jsonString === 'undefined'
  ) {
    return defaultValue
  }
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    return defaultValue
  }
}

// 清除缓存数据
function removeStorageKey() {
  return new Promise((resolve, reject) => {
    // 定义要查找的前缀
    const prefix = 'publish_form_cache:'
    // 遍历 localStorage 中的所有键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      // 检查键是否以指定前缀开头
      if (key.includes(prefix)) {
        console.log('key----' + key)
        // 获取该键的值
        const cachedData = localStorage.getItem(key)
        // 检查键是否存在
        if (cachedData) {
          // 删除指定的键
          localStorage.removeItem(cachedData)
          resolve('已删除指定的键')
        } else {
          $handleError('removeStorageKey:未找到匹配的键')
          reject('未找到匹配的键')
        }
      }
    }
  })
}

// 获取缓存数据
function getStorageKey() {
  return new Promise((resolve, reject) => {
    // 定义要查找的前缀
    const prefix = 'publish_form_cache:'
    const cachedDataList = []

    // 遍历 localStorage 中的所有键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      // 检查键是否以指定前缀开头
      if (key.includes(prefix)) {
        console.log('key----' + key)

        // 获取该键的值
        const cachedData = localStorage.getItem(key)
        console.log('找到的数据:', parseJSON(cachedData, []))
        // 将数据添加到结果列表中
        cachedDataList.push(key)
      }
    }

    // 检查是否找到了匹配的数据
    if (cachedDataList.length > 0) {
      resolve(cachedDataList)
    } else {
      $handleError('getStorageKey:未找到匹配的键')
      createNotification('getStorageKey:未找到匹配的键')
      reject('未找到匹配的键')
    }
  })
}

// 等待页面加载完成
function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve()
    } else {
      window.addEventListener('load', () => {
        resolve()
      })
    }
  })
}

// 重新加载页面
async function reloadPage(timeout = DELAY.PAGE_DELAY) {
  await delay(timeout)
  window.location.reload()
}
