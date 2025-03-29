<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      // 应用全局数据
    }
  },
  created() {
    // 监听配置页面显示事件
    if (window.electronAPI) {
      window.electronAPI.onShowConfig(() => {
        this.$router.push('/config');
      });
      
      // 监听下载链接处理事件
      window.electronAPI.onHandleDownloadUrl((url) => {
        // 如果当前在主页面，通知WebView处理下载链接
        if (this.$route.path === '/') {
          this.$emit('handle-download-url', url);
        }
      });
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.app-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}
</style>
