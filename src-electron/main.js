const { app, BrowserWindow, ipcMain, dialog, shell, protocol } = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');
const axios = require('axios');
const fs = require('fs');

// 初始化配置存储
const store = new Store({
  encryptionKey: 'nas-xunlei-client-secret-key',
  name: 'config',
  defaults: {
    nasUrl: '',
    downloadPath: '',
    autoOpen: true,
    username: '',
    password: ''
  }
});

// 是否处于调试模式
const isDebug = process.argv.includes('--debug');

// 主窗口引用
let mainWindow;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, // 启用 webview 标签
      webSecurity: false // 允许跨域请求，用于加载 NAS 地址
    },
    icon: path.join(__dirname, '../src/assets/icon.png')
  });

  // 检查配置是否存在
  const hasConfig = store.has('nasUrl') && store.get('nasUrl') !== '';
  
  // 根据配置状态加载不同的页面
  if (hasConfig && !process.argv.includes('--config')) {
    // 已配置且不是强制配置模式，加载主界面
    mainWindow.loadFile(path.join(__dirname, '../src/main-view.html'));
  } else {
    // 未配置或强制配置模式，加载配置页面
    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  }

  // 开发模式下打开开发者工具
  if (process.argv.includes('--debug')) {
    mainWindow.webContents.openDevTools();
  }

  // 窗口关闭时触发
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 检查配置是否存在
function checkConfig() {
  const hasConfig = store.has('nasUrl');
  if (!hasConfig) {
    // 如果没有配置，发送事件通知前端显示配置页面
    if (mainWindow) {
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('show-config');
      });
    }
  }
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  createWindow();

  // 注册自定义协议处理
  registerProtocolHandlers();

  app.on('activate', () => {
    // 在macOS上，当点击dock图标且没有其他窗口打开时，
    // 通常会在应用程序中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 注册协议处理器
function registerProtocolHandlers() {
  // 注册迅雷协议
  protocol.registerFileProtocol('thunder', (request, callback) => {
    const url = request.url.substr(9);
    handleDownloadUrl(url);
  });

  // 注册磁力链接协议
  protocol.registerFileProtocol('magnet', (request, callback) => {
    handleDownloadUrl(request.url);
  });
}

// 处理下载URL
function handleDownloadUrl(downloadUrl) {
  // 如果窗口不存在，创建窗口
  if (!mainWindow) {
    createWindow();
  }
  
  // 发送下载URL到渲染进程
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('handle-download-url', downloadUrl);
  });
  
  // 激活窗口
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
}

// 所有窗口关闭时退出应用（Windows和Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC通信处理
// 保存配置
ipcMain.on('save-config', (event, config) => {
  try {
    store.set(config);
    console.log('配置已保存');
    event.reply('config-saved', { success: true });
  } catch (error) {
    console.error('保存配置失败:', error);
    event.reply('config-saved', { success: false, error: error.message });
  }
});

// 获取配置
ipcMain.on('get-config', (event) => {
  try {
    const config = store.store;
    console.log('配置已加载');
    event.reply('config-loaded', config);
  } catch (error) {
    console.error('加载配置失败:', error);
    event.reply('config-loaded', {});
  }
});

// 测试连接
ipcMain.on('test-connection', async (event, nasUrl) => {
  try {
    const response = await axios.get(nasUrl, { timeout: 5000 });
    console.log('连接测试结果:', response.status);
    event.reply('connection-test-result', { 
      success: response.status >= 200 && response.status < 300,
      status: response.status
    });
  } catch (error) {
    console.error('连接测试失败:', error.message);
    event.reply('connection-test-result', { 
      success: false, 
      error: error.message 
    });
  }
});

// 选择文件夹
ipcMain.on('select-folder', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      console.log('已选择文件夹:', selectedPath);
      event.reply('folder-selected', selectedPath);
    }
  } catch (error) {
    console.error('选择文件夹失败:', error);
    event.reply('folder-selected', '');
  }
});

// 打开文件夹
ipcMain.on('open-folder', (event, folderPath) => {
  try {
    shell.openPath(folderPath);
    console.log('打开文件夹:', folderPath);
  } catch (error) {
    console.error('打开文件夹失败:', error);
  }
});

// 处理下载链接
ipcMain.on('handle-download-url', (event, url) => {
  // 处理下载链接的逻辑
  console.log('处理下载链接:', url);
  // 这里可以添加更多处理逻辑
});

// 窗口控制
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// 获取应用版本
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// 显示配置页面
ipcMain.on('show-config', () => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  }
});

// 显示主界面
ipcMain.on('show-main-view', () => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, '../src/main-view.html'));
  }
});

// 刷新NAS页面
ipcMain.on('refresh-nas-page', () => {
  if (mainWindow) {
    mainWindow.webContents.send('refresh-nas-webview');
  }
});

// 清除所有 cookie
ipcMain.on('clear-cookies', async (event) => {
  try {
    if (mainWindow && mainWindow.webContents) {
      const session = mainWindow.webContents.session;
      
      // 获取所有 cookie
      const cookies = await session.cookies.get({});
      console.log(`准备清除 ${cookies.length} 个 cookie`);
      
      // 逐个清除 cookie
      for (const cookie of cookies) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await session.cookies.remove(url, cookie.name);
      }
      
      // 清除存储数据
      await session.clearStorageData({
        storages: ['cookies', 'localstorage', 'sessionstorage', 'websql']
      });
      
      console.log('所有 cookie 已清除');
      event.reply('cookies-cleared', true);
      
      // 刷新 NAS WebView
      mainWindow.webContents.send('refresh-nas-webview');
    } else {
      console.error('无法访问窗口或 webContents');
      event.reply('cookies-cleared', false);
    }
  } catch (error) {
    console.error('清除 cookie 失败:', error);
    event.reply('cookies-cleared', false);
  }
});

// 处理协议启动
app.on('open-url', (event, url) => {
  event.preventDefault();
  
  // 如果窗口已关闭，重新创建窗口
  if (!mainWindow) {
    createWindow();
  }
  
  // 延迟发送消息，确保窗口已加载
  setTimeout(() => {
    mainWindow.webContents.send('handle-download-url', url);
  }, 1000);
});

// 注册自定义协议
app.whenReady().then(() => {
  protocol.registerFileProtocol('nas-xunlei', (request, callback) => {
    const url = request.url.substr(12);
    // 处理自定义协议
    if (mainWindow) {
      mainWindow.webContents.send('handle-download-url', url);
    }
    callback({ path: path.join(__dirname, '../src/blank.html') });
  });
});
