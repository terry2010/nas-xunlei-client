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
    async loadConfig() {
      try {
        const config = await window.electronAPI.getConfig();
        this.nasUrl = config.nasUrl || '';
        this.downloadPath = config.downloadPath || '';
        this.autoOpen = config.autoOpen !== undefined ? config.autoOpen : true;
        this.username = config.username || '';
        this.password = config.password || '';
        this.isConfigured = !!config.nasUrl;
        return config;
      } catch (error) {
        console.error('加载配置失败:', error);
        return {};
      }
    },
    
    // 保存配置
    async saveConfig() {
      try {
        const config = {
          nasUrl: this.nasUrl,
          downloadPath: this.downloadPath,
          autoOpen: this.autoOpen,
          username: this.username,
          password: this.password
        };
        
        // 使用旧的事件方式保存配置，因为saveConfig在preload中仍然是事件方式
        return new Promise((resolve) => {
          window.electronAPI.saveConfig(config);
          window.electronAPI.onConfigSaved((result) => {
            this.isConfigured = true;
            resolve(result);
          });
        });
      } catch (error) {
        console.error('保存配置失败:', error);
        throw error;
      }
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
