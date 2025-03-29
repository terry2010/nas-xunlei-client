use std::process::Command;
use tauri::command;
use crate::utils::error::Result;

/// 打开下载目录
#[command]
pub fn open_download_directory(path: String) -> Result<()> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args([&path])
            .spawn()?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args([&path])
            .spawn()?;
    }

    Ok(())
}

/// 处理下载链接
#[command]
pub fn handle_download_link(url: String) -> Result<()> {
    // 解析链接
    let parsed_url = url::Url::parse(&url)?;
    
    // 检查是否为支持的协议
    let scheme = parsed_url.scheme();
    if scheme != "thunder" && scheme != "magnet" {
        return Err(anyhow::anyhow!("不支持的协议: {}", scheme).into());
    }
    
    // 这里应该启动应用（如果未运行）
    // 然后通过WebView注入JavaScript模拟点击"新建任务"按钮
    // 并填充下载链接
    // 由于这部分需要与前端交互，实际实现会更复杂
    
    Ok(())
}
