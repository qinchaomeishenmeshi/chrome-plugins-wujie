// 最大错误次数
var MAX_ERROR_COUNT = 5

// 通用的调用接口方法
function $Request(api = '', { options = {}, params = {} } = {}) {
  const requestURL = API.BaseUrl + api
  console.log(
    '接口请求开始：' +
      JSON.stringify({
        api,
        options,
        params
      })
  )
  // 如果错误次数超过最大错误次数，直接返回
  if (MAX_ERROR_COUNT <= 0) {
    return Promise.reject(new Error('接口请求错误次数超过最大限制'))
  }

  return new Promise((resolve, reject) => {
    fetch(requestURL, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': options.contentType || 'application/json'
      },
      ...(options.method === 'GET' ? {} : { body: JSON.stringify(params) })
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(api + ':接口请求返回的data', data)
        if (data.code === 200) {
          resolve(data.data)
        } else {
          MAX_ERROR_COUNT--
          createNotification(`${api}---接口返回错误: ${JSON.stringify(data)}`)
          reject(new Error(`${api}---接口返回错误: ${JSON.stringify(data)}`))
        }
      })
      .catch((error) => {
        MAX_ERROR_COUNT--
        $handleError(`${api}---接口返回错误: ${JSON.stringify(data)}`)
        createNotification(`Fetch Error:: ${error}`)
        reject(error)
      })
  })
}

// 错误处理函数，将错误信息存储在 localStorage 中
async function $handleError(error) {
  console.log('发生错误:', error)

  // 获取存储的错误日志，并翻转数组
  const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]').reverse()

  console.log(errorLogs, 'errorLogs')
  // 创建新的错误日志
  const errorLog = {
    message: error.message || error,
    stack: error.stack,
    time: new Date().toLocaleString()
  }
  // 截取最新的20条错误日志
  errorLogs.splice(0, 20)
  // 将新的错误日志添加到错误日志数组中的第一个
  errorLogs.unshift(errorLog)

  // 更新本地存储中的错误日志
  localStorage.setItem('errorLogs', JSON.stringify(errorLogs))
}

async function taskFailed(error) {
  // 获取当前任务和错误日志
  const task = getCacheTask()
  console.log('任务失败:', task, error)
  // 发送请求，报告任务失败
  await $Request(API.failedApi, {
    options: { method: 'POST' },
    params: {
      id: task.id,
      failedReason: task.id + ':' + (error.message || error) + '_____' + new Date().toLocaleString()
    }
  }).catch((error) => {
    throw new Error('Failed to report error: ' + error)
  })
}
