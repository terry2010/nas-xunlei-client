<template>
  <div class="error-container">
    <el-result
      icon="error"
      :title="title"
      :sub-title="message"
    >
      <template #extra>
        <el-button type="primary" @click="$emit('retry')">重试</el-button>
        <el-button type="info" @click="$emit('config')">修改配置</el-button>
      </template>
    </el-result>
  </div>
</template>

<script>
export default {
  name: 'ErrorDisplay',
  props: {
    title: {
      type: String,
      default: '连接失败'
    },
    message: {
      type: String,
      default: '无法连接到NAS，请检查网络连接或NAS地址是否正确'
    }
  }
}
</script>

<style scoped>
.error-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
</style>
