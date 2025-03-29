<template>
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
</template>

<script>
export default {
  name: 'ControlBar',
  props: {
    canGoBack: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    goBack() {
      this.$emit('go-back');
    },
    refresh() {
      this.$emit('refresh');
    },
    openDownloadFolder() {
      this.$emit('open-folder');
    },
    goToConfig() {
      this.$emit('go-to-config');
    }
  }
}
</script>

<style scoped>
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
</style>
