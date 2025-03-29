use serde::{Deserialize, Serialize};
use reqwest::blocking::Client;
use std::time::Duration;
use tauri::command;
use crate::utils::error::Result;

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub nas_url: String,
    pub download_path: String,
    pub auto_open_client: bool,
    pub username: String,
    pub password: String,
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

/// 保存配置到安全存储
#[command]
pub fn save_config(config: Config) -> Result<()> {
    // 使用keyring保存敏感信息
    let keyring = keyring::Entry::new("nas-xunlei-client", "config")?;
    let config_json = serde_json::to_string(&config)?;
    keyring.set_password(&config_json)?;
    
    Ok(())
}

/// 从安全存储加载配置
#[command]
pub fn load_config() -> Result<Option<Config>> {
    let keyring = keyring::Entry::new("nas-xunlei-client", "config")?;
    
    match keyring.get_password() {
        Ok(config_json) => {
            let config: Config = serde_json::from_str(&config_json)?;
            Ok(Some(config))
        },
        Err(_) => Ok(None)
    }
}
