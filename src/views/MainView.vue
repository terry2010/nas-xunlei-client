<template>
  <div class="main-container">
    <!-- 顶部控制栏 -->
    <div class="control-bar">
      <div class="nav-buttons">
        <el-button type="primary" icon="el-icon-arrow-left" circle @click="goBack" :disabled="!canGoBack"></el-button>
        <el-button type="primary" icon="el-icon-refresh" circle @click="refresh"></el-button>
      </div>
      <div class="title">NAS迅雷客户端</div>
      <div class="action-buttons">
        <el-button type="success" @click="openDownloadFolder">打开下载目录</el-button>
        <el-button type="info" @click="goToConfig">配置</el-button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="error-container">
      <el-result
        icon="error"
        title="连接失败"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" @click="refresh">重试</el-button>
          <el-button type="info" @click="goToConfig">修改配置</el-button>
        </template>
      </el-result>
    </div>
    
    <!-- WebView 容器 -->
    <div v-else class="webview-container">
      <webview
        ref="webview"
        :src="nasUrl"
        class="webview"
        @did-start-loading="handleStartLoading"
        @did-stop-loading="handleStopLoading"
        @did-fail-load="handleLoadFailed"
        @dom-ready="handleDomReady"
      ></webview>
    </div>
  </div>
</template>

<script>
import { useConfigStore } from '../store/config';

export default {
  name: 'MainView',
  data() {
    return {
      loading: true,
      error: false,
      errorMessage: '',
      canGoBack: false
    }
  },
  computed: {
    nasUrl() {
      return this.configStore.nasUrl;
    }
  },
  created() {
    this.configStore = useConfigStore();
    
    // 加载配置
    this.configStore.loadConfig().then(() => {
      // 如果未配置，跳转到配置页面
      if (!this.configStore.isConfigured) {
        this.$router.push('/config');
      }
    });
    
    // 监听下载链接处理事件
    if (window.electronAPI) {
      window.electronAPI.onHandleDownloadUrl((url) => {
        this.handleDownloadUrl(url);
      });
    }
  },
  beforeUnmount() {
    // 清除事件监听
    if (window.electronAPI) {
      window.electronAPI.onHandleDownloadUrl(null);
    }
  },
  methods: {
    // 处理WebView开始加载
    handleStartLoading() {
      this.loading = true;
      this.error = false;
    },
    
    // 处理WebView加载完成
    handleStopLoading() {
      this.loading = false;
      
      // 更新是否可以后退
      if (this.$refs.webview) {
        this.canGoBack = this.$refs.webview.canGoBack();
      }
    },
    
    // 处理WebView加载失败
    handleLoadFailed(event) {
      this.loading = false;
      this.error = true;
      
      // 根据错误代码设置错误消息
      switch (event.errorCode) {
        case -2:
          this.errorMessage = '无法连接到NAS，请检查网络连接或NAS地址是否正确';
          break;
        case -3:
          this.errorMessage = 'NAS地址无效，请检查配置';
          break;
        default:
          this.errorMessage = `加载失败 (错误码: ${event.errorCode})`;
      }
    },
    
    // 处理WebView DOM就绪
    handleDomReady() {
      // 触发WebView就绪事件，用于注入自定义脚本
      const event = new CustomEvent('webview-ready', { detail: this.$refs.webview });
      document.dispatchEvent(event);
      
      // 更新是否可以后退
      this.canGoBack = this.$refs.webview.canGoBack();
    },
    
    // 处理下载链接
    handleDownloadUrl(url) {
      if (this.$refs.webview) {
        // 注入脚本处理下载链接
        this.$refs.webview.executeJavaScript(`
          // 处理下载链接
          function handleDownloadLink(url) {
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
                  urlInput.value = "${url}";
                  
                  // 模拟输入事件
                  const event = new Event('input', { bubbles: true });
                  urlInput.dispatchEvent(event);
                }
              }, 500);
            }
          }
          
          // 执行处理
          handleDownloadLink("${url}");
        `);
      }
    },
    
    // 刷新WebView
    refresh() {
      if (this.$refs.webview) {
        this.$refs.webview.reload();
      }
    },
    
    // 返回上一页
    goBack() {
      if (this.$refs.webview && this.$refs.webview.canGoBack()) {
        this.$refs.webview.goBack();
      }
    },
    
    // 打开下载目录
    openDownloadFolder() {
      this.configStore.openDownloadFolder().then((result) => {
        if (!result.success) {
          this.$message.error(result.error || '无法打开下载目录');
        }
      });
    },
    
    // 跳转到配置页面
    goToConfig() {
      this.$router.push('/config');
    }
  }
}
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  height: 60px;
}

.nav-buttons, .action-buttons {
  display: flex;
  gap: 10px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.webview-container {
  flex: 1;
  position: relative;
}

.webview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.loading-container, .error-container {
  padding: 20px;
  height: calc(100% - 60px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
