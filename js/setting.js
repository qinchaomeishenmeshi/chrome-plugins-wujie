// 最大错误次数
var MAX_ERROR_COUNT = 5

// 每页的子账号数量
const itemsPerPage = 5

// 延迟时间设置
const DELAY = {
  // DOM 操作延迟时间
  DOM_DELAY: 2000,
  // 页面加载延迟时间
  PAGE_DELAY: 5000
}

// 接口API
const API = {
  // basicURL
  BaseUrl: 'https://wujie.top/chromePath/dev-api/videoclip',
  // BaseUrl: 'https://bj.devwwd.site:449/dev-api/videoclip',
  // 获取任务task的api
  getTaskApi: '/admin/autopublishtask/getNoPublicData',
  // 同步账号的api
  syncAccountApi: '/admin/juzhensubaccount/accountManage',
  // 发布成功的api
  updateAutoPublishTaskApi: '/admin/autopublishtask/updateAutoPublishTask',
  // 记录失败日志的api
  failedApi: '/admin/autopublishtask/failAutoPublishTask'
}

// 页面地址
const PAGE = {
  // 机构号首页
  creatorHomePage: 'https://creator.douyin.com/creator-micro/home',
  // 子账号首页
  childCreatorHomePage: 'https://creator.douyin.com/',
  // 子账号内容管理页码
  childContentPage: 'https://creator.douyin.com/content/manage',
  // 子账号发布管理页面
  childHomePage: 'https://creator.douyin.com/content/',
  // 子账号上传页面
  childUploadPage: 'https://creator.douyin.com/content/upload',
  // 子账号发布页面
  childPublishPage: 'https://creator.douyin.com/content/publish?enter_from=publish_page',
  // 测试页面
  systemPage: 'https://bj.devwwd.site'
}
