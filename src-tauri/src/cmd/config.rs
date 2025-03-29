use serde::{Deserialize, Serialize};
use reqwest::blocking::Client;
use std::time::Duration;
use tauri::command;
use crate::utils::error::Result;
use std::fs;
use std::path::PathBuf;
use tauri::api::path;

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub nas_url: String,
    pub download_path: String,
    pub auto_open_client: bool,
    pub username: String,
    pub password: String,
}

/// 获取配置文件路径
fn get_config_path() -> Result<PathBuf> {
    let app_dir = path::app_data_dir(&tauri::Config::default()).ok_or_else(|| {
        std::io::Error::new(std::io::ErrorKind::NotFound, "无法获取应用目录")
    })?;
    
    Ok(app_dir.join("config.json"))
}

/// 测试NAS连接
#[command]
pub fn test_nas_connection(url: String) -> Result<bool> {
    let client = Client::builder()
        .timeout(Duration::from_secs(5))
        .build()?;
    
    let response = client.get(&url)
        .send();
    
    match response {
        Ok(res) => Ok(res.status().is_success()),
        Err(_) => Ok(false)
    }
}

/// 保存配置到config.json文件
#[command]
pub fn save_config(config: Config) -> Result<()> {
    // 获取配置文件路径
    let config_path = get_config_path()?;
    
    // 确保目录存在
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)?;
    }
    
    // 将配置序列化为JSON并保存到文件
    let config_json = serde_json::to_string_pretty(&config)?;
    fs::write(config_path, config_json)?;
    
    Ok(())
}

/// 从config.json文件加载配置
#[command]
pub fn load_config() -> Result<Option<Config>> {
    let config_path = get_config_path()?;
    
    // 检查配置文件是否存在
    if !config_path.exists() {
        return Ok(None);
    }
    
    // 读取并解析配置文件
    let config_json = fs::read_to_string(config_path)?;
    let config: Config = serde_json::from_str(&config_json)?;
    
    Ok(Some(config))
}

/// 检查配置是否存在
#[command]
pub fn check_config_exists() -> Result<bool> {
    let config_path = get_config_path()?;
    Ok(config_path.exists())
}
