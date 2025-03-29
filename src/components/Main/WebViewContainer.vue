<template>
  <div class="webview-container">
    <div v-if="loading" class="loading-overlay">
      <el-skeleton :rows="10" animated />
    </div>
    <webview
      ref="webview"
      :src="src"
      class="webview"
      @did-start-loading="handleStartLoading"
      @did-stop-loading="handleStopLoading"
      @did-fail-load="handleLoadFailed"
      @dom-ready="handleDomReady"
    ></webview>
  </div>
</template>

<script>
import { injectOpenFolderButton, handleDownloadLink } from '../../utils/webview';
import { isLoginPage, detectLoginStep, fillLoginForm, submitLoginForm } from '../../utils/auth';

export default {
  name: 'WebViewContainer',
  props: {
    src: {
      type: String,
      required: true
    },
    credentials: {
      type: Object,
      default: () => ({
        username: '',
        password: ''
      })
    },
    downloadPath: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: true,
      canGoBack: false
    }
  },
  methods: {
    // 处理WebView开始加载
    handleStartLoading() {
      this.loading = true;
      this.$emit('loading', true);
    },
    
    // 处理WebView加载完成
    handleStopLoading() {
      this.loading = false;
      this.$emit('loading', false);
      
      // 更新是否可以后退
      if (this.$refs.webview) {
        this.canGoBack = this.$refs.webview.canGoBack();
        this.$emit('can-go-back-change', this.canGoBack);
      }
    },
    
    // 处理WebView加载失败
    handleLoadFailed(event) {
      this.loading = false;
      this.$emit('loading', false);
      this.$emit('load-failed', event);
    },
    
    // 处理WebView DOM就绪
    handleDomReady() {
      const webview = this.$refs.webview;
      if (!webview) return;
      
      // 获取当前URL
      const currentUrl = webview.getURL();
      
      // 注入自定义功能
      webview.executeJavaScript(`
        // 存储凭证供注入脚本使用
        window.electronAPI = {
          getStoredUsername: () => "${this.credentials.username}",
          getStoredPassword: () => "${this.credentials.password}",
          openDownloadFolder: () => {
            const event = new CustomEvent('open-download-folder');
            document.dispatchEvent(event);
          }
        };
      `);
      
      // 处理登录页面
      if (isLoginPage(currentUrl)) {
        this.handleLoginPage(webview);
      } else {
        // 处理迅雷应用页面
        this.handleXunleiPage(webview);
      }
      
      // 更新是否可以后退
      this.canGoBack = webview.canGoBack();
      this.$emit('can-go-back-change', this.canGoBack);
    },
    
    // 处理登录页面
    handleLoginPage(webview) {
      webview.executeJavaScript(`
        // 检测登录步骤
        const step = (${detectLoginStep.toString()})(window.location.href, document);
        
        // 填充登录表单
        const credentials = {
          username: "${this.credentials.username}",
          password: "${this.credentials.password}"
        };
        
        const filled = (${fillLoginForm.toString()})(document, step, credentials);
        
        // 提交登录表单
        if (filled) {
          setTimeout(() => {
            (${submitLoginForm.toString()})(document);
          }, 500);
        }
      `);
    },
    
    // 处理迅雷应用页面
    handleXunleiPage(webview) {
      webview.executeJavaScript(`
        // 添加打开下载目录按钮
        (${injectOpenFolderButton.toString()})(document, () => {
          window.electronAPI.openDownloadFolder();
        });
        
        // 监听打开下载目录事件
        document.addEventListener('open-download-folder', () => {
          // 通知主进程打开下载目录
          const event = new CustomEvent('open-folder', { detail: "${this.downloadPath}" });
          window.parent.document.dispatchEvent(event);
        });
      `);
      
      // 监听打开文件夹事件
      webview.addEventListener('console-message', (e) => {
        if (e.message.includes('open-folder')) {
          this.$emit('open-folder');
        }
      });
    },
    
    // 处理下载链接
    handleDownloadUrl(url) {
      if (!this.$refs.webview) return;
      
      this.$refs.webview.executeJavaScript(`
        (${handleDownloadLink.toString()})(document, "${url}");
      `);
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
    }
  }
}
</script>

<style scoped>
.webview-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.webview {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  z-index: 10;
  padding: 20px;
}
</style>
