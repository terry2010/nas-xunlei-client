const { contextBridge, ipcRenderer, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// 安全地暴露 Electron API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 配置相关
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  getConfig: () => ipcRenderer.send('get-config'),
  onConfigLoaded: (callback) => ipcRenderer.on('config-loaded', (_, config) => callback(config)),
  onConfigSaved: (callback) => ipcRenderer.on('config-saved', (_, result) => callback(result)),
  
  // 连接测试
  testConnection: (url) => ipcRenderer.send('test-connection', url),
  onConnectionTestResult: (callback) => ipcRenderer.on('connection-test-result', (_, result) => callback(result)),
  
  // 文件夹选择
  selectFolder: () => ipcRenderer.send('select-folder'),
  onFolderSelected: (callback) => ipcRenderer.on('folder-selected', (_, path) => callback(path)),
  
  // 打开文件夹
  openFolder: (folderPath) => ipcRenderer.send('open-folder', folderPath),
  
  // 页面导航
  showConfig: () => ipcRenderer.send('show-config'),
  showMainView: () => ipcRenderer.send('show-main-view'),
  refreshNasPage: () => ipcRenderer.send('refresh-nas-page'),
  onRefreshNasWebview: (callback) => ipcRenderer.on('refresh-nas-webview', () => callback()),
  
  // Cookie 管理
  clearCookies: () => ipcRenderer.send('clear-cookies'),
  onCookiesCleared: (callback) => ipcRenderer.on('cookies-cleared', (_, success) => callback(success)),
  
  // 系统信息
  getPlatform: () => process.platform
});

// WebView 相关功能
if (process.isMainFrame) {
  // 主框架中的功能
} else {
  // WebView 中的功能
  contextBridge.exposeInMainWorld('webviewAPI', {
    // 向主进程发送消息
    sendToMain: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    // 接收来自主进程的消息
    onMessage: (channel, callback) => {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  });
}

// WebView相关功能
window.addEventListener('DOMContentLoaded', () => {
  // 监听WebView元素创建
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'WEBVIEW') {
            setupWebView(node);
          }
        });
      }
    });
  });
  
  // 开始观察DOM变化
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 设置WebView
  function setupWebView(webview) {
    webview.addEventListener('dom-ready', () => {
      // 获取当前URL
      const currentUrl = webview.getURL();
      
      // 注入辅助脚本
      webview.executeJavaScript(`
        // 创建一个全局对象用于与主进程通信
        window.nasXunleiClient = {
          // 存储凭证
          credentials: {
            username: '',
            password: ''
          },
          
          // 设置凭证
          setCredentials(username, password) {
            this.credentials.username = username;
            this.credentials.password = password;
          },
          
          // 打开下载目录
          openDownloadFolder() {
            const event = new CustomEvent('xunlei-open-folder');
            document.dispatchEvent(event);
          },
          
          // 处理下载链接
          handleDownloadUrl(url) {
            // 查找新建任务按钮
            const newTaskButton = document.querySelector('button:contains("新建任务"), button:contains("New Task")');
            
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
                }
              }, 500);
            }
          },
          
          // 添加打开下载目录按钮
          addOpenFolderButton() {
            // 检查按钮是否已存在
            if (document.getElementById('open-download-folder')) {
              return;
            }
            
            // 创建按钮
            const button = document.createElement('button');
            button.id = 'open-download-folder';
            button.innerText = '打开下载目录';
            button.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 8px 16px; background-color: #1989fa; color: white; border: none; border-radius: 4px; cursor: pointer;';
            
            // 添加点击事件
            button.addEventListener('click', () => {
              this.openDownloadFolder();
            });
            
            // 添加到页面
            document.body.appendChild(button);
          }
        };
      `);
      
      // 根据URL类型注入不同的功能
      if (currentUrl.includes('login') || currentUrl.includes('auth')) {
        // 登录页面
        webview.executeJavaScript(`
          // 获取存储的登录信息
          window.nasXunleiClient.setCredentials("${webview.getWebContents().getUserAgent()}", "${webview.getWebContents().getUserAgent()}");
          
          // 自动填充登录表单
          function autoFillLoginForm() {
            // 查找用户名输入框
            const usernameInput = document.querySelector('input[type="text"], input[name="username"], input[id="username"]');
            // 查找密码输入框
            const passwordInput = document.querySelector('input[type="password"], input[name="password"], input[id="password"]');
            // 查找登录按钮
            const loginButton = document.querySelector('button[type="submit"], input[type="submit"], button:contains("登录"), button:contains("Login")');
            
            // 填充用户名
            if (usernameInput && window.nasXunleiClient.credentials.username) {
              usernameInput.value = window.nasXunleiClient.credentials.username;
              usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            // 填充密码
            if (passwordInput && window.nasXunleiClient.credentials.password) {
              passwordInput.value = window.nasXunleiClient.credentials.password;
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            // 点击登录按钮
            if (loginButton) {
              loginButton.click();
            }
          }
          
          // 延迟执行，确保页面元素已加载
          setTimeout(autoFillLoginForm, 1000);
        `);
      } else if (currentUrl.includes('download') || currentUrl.includes('xunlei')) {
        // 迅雷应用页面
        webview.executeJavaScript(`
          // 添加打开下载目录按钮
          window.nasXunleiClient.addOpenFolderButton();
          
          // 监听打开下载目录事件
          document.addEventListener('xunlei-open-folder', () => {
            // 通知主进程打开下载目录
            window.postMessage({ type: 'open-download-folder' }, '*');
          });
        `);
      }
    });
    
    // 监听WebView消息
    webview.addEventListener('ipc-message', (event) => {
      if (event.channel === 'open-download-folder') {
        ipcRenderer.send('open-download-folder');
      }
    });
  }
});
