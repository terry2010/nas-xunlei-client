use thiserror::Error;
use tauri::InvokeError;

#[derive(Debug, Error)]
pub enum Error {
    #[error("IO错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("序列化错误: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("HTTP请求错误: {0}")]
    Reqwest(#[from] reqwest::Error),

    #[error("URL解析错误: {0}")]
    Url(#[from] url::ParseError),

    #[error("安全存储错误: {0}")]
    Keyring(#[from] keyring::Error),

    #[error("通用错误: {0}")]
    Anyhow(#[from] anyhow::Error),
}

// 实现 Into<InvokeError> 特性，使我们的错误类型可以转换为 Tauri 的 InvokeError
impl Into<InvokeError> for Error {
    fn into(self) -> InvokeError {
        InvokeError::from(self.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
