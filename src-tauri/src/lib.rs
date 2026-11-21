pub mod constants;

use futures_util::stream;
use serde::Serialize;
use tauri::Emitter;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UploadProgress {
  request_id: String,
  loaded: usize,
  total: usize,
  progress: u8,
}

#[tauri::command]
async fn upload_app_icon(
  app: tauri::AppHandle,
  image_base64: String,
  image_name: String,
  api_key: Option<String>,
  request_id: String,
) -> Result<String, String> {
  let key = api_key
    .filter(|value| !value.trim().is_empty())
    .unwrap_or_else(|| constants::INTERNAL_IMGBB_API_KEY.to_string());
  let boundary = format!("----KruztyDynamics{}", request_id.replace('-', ""));
  let safe_name: String = image_name
    .chars()
    .filter(|character| character.is_ascii_alphanumeric() || ".-_".contains(*character))
    .collect();
  let safe_name = if safe_name.is_empty() { "app-icon" } else { &safe_name };
  let body = format!(
    "--{boundary}\r\nContent-Disposition: form-data; name=\"image\"\r\n\r\n{image_base64}\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n{safe_name}\r\n--{boundary}--\r\n"
  ).into_bytes();
  let total = body.len();
  let chunk_size = 16 * 1024;
  let progress_app = app.clone();
  let progress_request_id = request_id.clone();
  let upload_stream = stream::unfold(
    (body, 0usize, std::time::Instant::now()),
    move |(body, offset, mut last_emit)| {
      let app = progress_app.clone();
      let request_id = progress_request_id.clone();
      async move {
        if offset >= body.len() {
          return None;
        }
        let end = (offset + chunk_size).min(body.len());
        let chunk = body[offset..end].to_vec();
        let progress = ((end * 100) / total).min(100) as u8;
        if end == total || last_emit.elapsed() >= std::time::Duration::from_millis(100) {
          let _ = app.emit(
            "imgbb-upload-progress",
            UploadProgress { request_id, loaded: end, total, progress },
          );
          last_emit = std::time::Instant::now();
        }
        Some((Ok::<Vec<u8>, std::io::Error>(chunk), (body, end, last_emit)))
      }
    },
  );

  let client = reqwest::Client::builder()
    .timeout(std::time::Duration::from_secs(90))
    .build()
    .map_err(|error| format!("Could not prepare ImgBB upload: {error}"))?;
  let response = client
    .post("https://api.imgbb.com/1/upload")
    .query(&[("key", key)])
    .header("Content-Type", format!("multipart/form-data; boundary={boundary}"))
    .header("Content-Length", total)
    .body(reqwest::Body::wrap_stream(upload_stream))
    .send()
    .await
    .map_err(|error| format!("ImgBB upload failed: {error}"))?;
  let status = response.status();
  let result: serde_json::Value = response
    .json()
    .await
    .map_err(|error| format!("ImgBB returned an invalid response: {error}"))?;

  if !status.is_success() || result["success"] != true {
    return Err(result["error"]["message"]
      .as_str()
      .unwrap_or("ImgBB rejected the image upload.")
      .to_string());
  }

  result["data"]["display_url"]
    .as_str()
    .or_else(|| result["data"]["url"].as_str())
    .map(str::to_string)
    .ok_or_else(|| "ImgBB did not return an image URL.".to_string())
}

#[tauri::command]
fn get_platform_info() -> String {
  format!("Tauri v2 Core Online ({})", std::env::consts::OS)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .build(),
    )
    .invoke_handler(tauri::generate_handler![get_platform_info, upload_app_icon])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
