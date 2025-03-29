import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', {
  state: () => ({
    nasUrl: '',
    downloadPath: '',
    autoOpenClient: true,
    username: '',
    password: '',
    isConfigured: false
  }),
  
  actions: {
    setConfig(config) {
      this.nasUrl = config.nasUrl
      this.downloadPath = config.downloadPath
      this.autoOpenClient = config.autoOpenClient
      this.username = config.username
      this.password = config.password
      this.isConfigured = true
    },
    
    clearConfig() {
      this.nasUrl = ''
      this.downloadPath = ''
      this.autoOpenClient = true
      this.username = ''
      this.password = ''
      this.isConfigured = false
    }
  },
  
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'nas-xunlei-config',
        storage: localStorage,
        paths: ['nasUrl', 'downloadPath', 'autoOpenClient', 'username', 'isConfigured']
      }
    ]
  }
})
