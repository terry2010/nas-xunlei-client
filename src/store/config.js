import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', {
  state: () => ({
    nasUrl: '',
    downloadPath: '',
    autoOpen: true,
    username: '',
    password: '',
    isConfigured: false,
    isConnected: false
  }),
  
  actions: {
    // 加载配置
    loadConfig() {
      return new Promise((resolve) => {
        window.electronAPI.getConfig();
        window.electronAPI.onConfigLoaded((config) => {
          this.nasUrl = config.nasUrl;
          this.downloadPath = config.downloadPath;
          this.autoOpen = config.autoOpen;
          this.username = config.username;
          this.password = config.password;
          this.isConfigured = !!config.nasUrl;
          resolve(config);
        });
      });
    },
    
    // 保存配置
    saveConfig() {
      return new Promise((resolve) => {
        const config = {
          nasUrl: this.nasUrl,
          downloadPath: this.downloadPath,
          autoOpen: this.autoOpen,
          username: this.username,
          password: this.password
        };
        
        window.electronAPI.saveConfig(config);
        window.electronAPI.onConfigSaved((result) => {
          this.isConfigured = true;
          resolve(result);
        });
      });
    },
    
    // 测试NAS连接
    testConnection() {
      return new Promise((resolve) => {
        window.electronAPI.testConnection(this.nasUrl);
        window.electronAPI.onConnectionTestResult((result) => {
          this.isConnected = result.success;
          resolve(result);
        });
      });
    },
    
    // 打开下载目录
    openDownloadFolder() {
      return new Promise((resolve) => {
        window.electronAPI.openDownloadFolder(this.downloadPath);
        window.electronAPI.onOpenFolderResult((result) => {
          resolve(result);
        });
      });
    }
  }
})
