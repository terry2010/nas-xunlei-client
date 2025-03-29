/**
 * WebView 交互相关工具函数
 */

/**
 * 注入自定义按钮到迅雷应用页面
 * @param {Document} document - 当前页面文档对象
 * @param {Function} callback - 按钮点击回调函数
 */
export function injectOpenFolderButton(document, callback) {
  // 检查是否已存在按钮，避免重复注入
  if (document.querySelector('#open-download-folder')) {
    return;
  }

  // 查找迅雷应用页面的工具栏
  const toolbar = document.querySelector('.toolbar');
  if (!toolbar) {
    console.warn('未找到迅雷应用工具栏，无法注入按钮');
    return;
  }

  // 创建"打开下载目录"按钮
  const button = document.createElement('button');
  button.id = 'open-download-folder';
  button.className = 'el-button el-button--primary';
  button.innerHTML = '<span>打开下载目录</span>';
  button.style.marginLeft = '10px';
  
  // 添加点击事件
  button.addEventListener('click', callback);
  
  // 插入到工具栏
  toolbar.appendChild(button);
}

/**
 * 模拟点击"新建任务"按钮
 * @param {Document} document - 当前页面文档对象
 * @returns {boolean} - 是否成功点击
 */
export function clickNewTaskButton(document) {
  const newTaskButton = document.querySelector('.btn-new-task');
  if (newTaskButton) {
    newTaskButton.click();
    return true;
  }
  return false;
}

/**
 * 自动填充下载链接到新建任务表单
 * @param {Document} document - 当前页面文档对象
 * @param {string} url - 下载链接
 * @returns {boolean} - 是否成功填充
 */
export function fillDownloadLink(document, url) {
  // 等待新建任务对话框出现
  const urlInput = document.querySelector('.task-url-input');
  if (urlInput) {
    urlInput.value = url;
    // 触发输入事件，确保Vue能检测到值的变化
    const event = new Event('input', { bubbles: true });
    urlInput.dispatchEvent(event);
    return true;
  }
  return false;
}

/**
 * 检测当前页面是否为迅雷应用页面
 * @param {string} url - 当前页面URL
 * @returns {boolean} - 是否为迅雷应用页面
 */
export function isXunleiAppPage(url) {
  return url.includes('/webman/3rdparty/Thunder');
}
