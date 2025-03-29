/**
 * WebView交互相关工具函数
 */

/**
 * 注入自定义按钮到WebView页面
 * @param {Document} document - WebView页面的document对象
 * @param {Function} callback - 按钮点击回调函数
 */
export function injectOpenFolderButton(document, callback) {
  // 检查按钮是否已存在
  if (document.getElementById('open-download-folder')) {
    return;
  }
  
  // 创建按钮
  const button = document.createElement('button');
  button.id = 'open-download-folder';
  button.innerText = '打开下载目录';
  button.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 8px 16px; background-color: #1989fa; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
  
  // 添加悬停效果
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#0d7efd';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#1989fa';
  });
  
  // 添加点击事件
  button.addEventListener('click', callback);
  
  // 添加到页面
  document.body.appendChild(button);
}

/**
 * 检测页面类型
 * @param {string} url - 当前页面URL
 * @returns {string} - 页面类型：'login', 'xunlei', 'other'
 */
export function detectPageType(url) {
  if (url.includes('login') || url.includes('auth') || url.includes('signin')) {
    return 'login';
  }
  
  if (url.includes('download') || url.includes('xunlei') || url.includes('thunder')) {
    return 'xunlei';
  }
  
  return 'other';
}

/**
 * 处理下载链接
 * @param {Document} document - WebView页面的document对象
 * @param {string} url - 下载链接
 * @returns {boolean} - 是否成功处理
 */
export function handleDownloadLink(document, url) {
  // 查找新建任务按钮
  const newTaskButton = document.querySelector('button:contains("新建任务"), button:contains("New Task"), a:contains("新建任务"), a:contains("New Task")');
  
  if (newTaskButton) {
    // 点击新建任务按钮
    newTaskButton.click();
    
    // 等待任务表单出现
    setTimeout(() => {
      // 查找URL输入框
      const urlInput = document.querySelector('input[type="text"], textarea');
      
      if (urlInput) {
        // 填充下载链接
        urlInput.value = url;
        
        // 模拟输入事件
        const event = new Event('input', { bubbles: true });
        urlInput.dispatchEvent(event);
        
        return true;
      }
    }, 500);
  }
  
  return false;
}

/**
 * 注入CSS样式到WebView
 * @param {Document} document - WebView页面的document对象
 * @param {string} css - CSS样式字符串
 */
export function injectCSS(document, css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * 监听页面变化
 * @param {WebviewTag} webview - Electron WebView元素
 * @param {Function} callback - 页面变化回调函数
 */
export function watchPageChanges(webview, callback) {
  // 监听页面加载完成事件
  webview.addEventListener('did-finish-load', () => {
    const currentUrl = webview.getURL();
    callback(currentUrl);
  });
  
  // 监听页面开始加载事件
  webview.addEventListener('did-start-navigation', (event) => {
    callback(event.url);
  });
}
