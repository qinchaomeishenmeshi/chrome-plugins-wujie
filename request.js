
// 通用的调用接口方法
function $Request(url = '', { options = {}, params = {} } = {}) {
  const baseURL = 'https://bj.devwwd.site:449/dev-api/videoclip'
  const requestURL = baseURL + url
  console.log('接口请求开始');

  return new Promise((resolve, reject) => {
    fetch(requestURL, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': options.contentType || 'application/json',
      },
      ...(options.method === 'GET' ? {} : { body: JSON.stringify(params) }),

    })
      .then(response => response.json())
      .then(data => {
        console.log(data, '接口请求返回的data');
        if (data.code === 200) {
          resolve(data.data);
        } else {
          reject(new Error(`接口返回错误: ${data.message}`));
        }
      })
      .catch(error => {
        console.error('Fetch Error:', error);
        reject(error);
      });
  });
}

// 错误处理函数，将错误信息存储在 localStorage 中
function $handleError(error) {
  console.log('发生错误:', error)
  const errorLogs = parseJSON(localStorage.getItem('errorLogs'), [])
  const errorLog = {
    message: error.message,
    stack: error.stack,
    time: new Date().toISOString()
  }
  errorLogs.push(errorLog)
  localStorage.setItem('errorLogs', JSON.stringify(errorLogs))
}