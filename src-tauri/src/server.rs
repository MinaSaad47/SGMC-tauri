use axum::{
    extract::{Multipart, Query, State},
    http::StatusCode,
    response::{Html, IntoResponse},
    routing::{get, post},
    Router,
};
use base64::Engine;
use serde::Deserialize;
use tauri::{AppHandle, Emitter, Manager};
use tokio::net::TcpListener;
use crate::app_state::AppState;

// AppHandle is Clone + Send + Sync, so we can use it directly as State
type ServerState = AppHandle;

#[derive(Deserialize)]
struct OAuthQuery {
    code: String,
}

pub async fn start_server(app: AppHandle) -> u16 {
    let app_state = app.clone();

    let router = Router::new()
        .route("/scan", get(get_scan_page))
        .route("/upload", post(handle_upload))
        .route("/oauth/callback", get(handle_oauth))
        .with_state(app_state);

    let port = app.state::<AppState>().config.port;
    let listener = TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();

    tokio::spawn(async move {
        axum::serve(listener, router).await.unwrap();
    });

    port
}

async fn get_scan_page() -> Html<&'static str> {
    Html(
        r##"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scanner</title>
    <style>
        :root { --primary: #2563eb; --primary-hover: #1d4ed8; --secondary: #3f3f46; --bg: #09090b; --text: #fff; --error: #ef4444; --success: #22c55e; }
        body { background-color: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
        h1 { margin-bottom: 2.5rem; font-size: 2rem; font-weight: 800; letter-spacing: -0.025em; }
        .container { width: 100%; max-width: 360px; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        
        /* Main View */
        .btn-group { display: flex; flex-direction: column; gap: 1.25rem; width: 100%; align-items: center; }
        .btn { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 1.25rem; font-size: 1.1rem; border-radius: 16px; border: none; font-weight: 600; cursor: pointer; transition: transform 0.1s, background-color 0.2s; width: 100%; box-sizing: border-box; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); text-decoration: none; color: white; position: relative; overflow: hidden; }
        .btn-primary { background-color: var(--primary); }
        .btn-primary:active { background-color: var(--primary-hover); transform: scale(0.98); }
        .btn-secondary { background-color: var(--secondary); }
        .btn-secondary:active { transform: scale(0.98); opacity: 0.9; }
        .icon { width: 24px; height: 24px; }
        #status { font-size: 1rem; color: #a1a1aa; min-height: 1.5rem; }
        input { display: none; }
        
        /* Progress Bar */
        .progress-container { width: 100%; height: 6px; background: #27272a; border-radius: 99px; overflow: hidden; display: none; margin-top: 1rem; }
        .progress-bar { height: 100%; background: var(--primary); width: 0%; transition: width 0.1s linear; }

        /* Success View */
        #success-view { display: none; flex-direction: column; align-items: center; gap: 1.5rem; animation: fadeIn 0.5s ease-out; }
        .checkmark { width: 80px; height: 80px; background: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); margin-bottom: 1rem; }
        .checkmark svg { width: 40px; height: 40px; color: white; stroke-width: 3; }
        .success-text { font-size: 1.5rem; font-weight: 700; color: white; }
        .success-sub { color: #a1a1aa; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container" id="main-view">
        <h1>SGMC Scanner</h1>
        
        <div class="btn-group" id="controls">
            <label class="btn btn-primary">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Take Photo</span>
                <input type="file" id="cam" accept="image/*" capture="environment">
            </label>

            <label class="btn btn-secondary">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>Upload from Gallery</span>
                <input type="file" id="gallery" accept="image/*">
            </label>
        </div>

        <div class="progress-container" id="progressContainer">
            <div class="progress-bar" id="progressBar"></div>
        </div>

        <p id="status">Ready to scan</p>
    </div>

    <div class="container" id="success-view">
        <div class="checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div>
            <div class="success-text">Upload Complete!</div>
            <div class="success-sub">The image has been sent to your PC.</div>
        </div>
        <p class="success-sub" style="margin-top: 1rem; font-size: 0.9rem;">You can now close this tab.</p>
    </div>

    <script>
        const mainView = document.getElementById('main-view');
        const successView = document.getElementById('success-view');
        const cam = document.getElementById('cam');
        const gallery = document.getElementById('gallery');
        const status = document.getElementById('status');
        const controls = document.getElementById('controls');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');

        const uploadFile = (file) => {
            if (!file) return;
            
            // UI Reset
            status.innerText = "Starting upload...";
            status.style.color = "#fbbf24"; // yellow
            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            controls.style.opacity = '0.5';
            controls.style.pointerEvents = 'none';

            const fd = new FormData();
            fd.append('file', file);

            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    progressBar.style.width = percent + '%';
                    status.innerText = `Uploading... ${Math.round(percent)}%`;
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Show Success View
                    mainView.style.display = 'none';
                    successView.style.display = 'flex';
                } else {
                    handleError();
                }
            });

            xhr.addEventListener("error", handleError);
            xhr.open("POST", "/upload");
            xhr.send(fd);
        };

        const handleError = () => {
            status.innerText = "❌ Upload Failed";
            status.style.color = "var(--error)";
            progressBar.style.background = "var(--error)";
            controls.style.opacity = '1';
            controls.style.pointerEvents = 'auto';
        };

        cam.onchange = (e) => uploadFile(e.target.files[0]);
        gallery.onchange = (e) => uploadFile(e.target.files[0]);
    </script>
</body>
</html>
"##,
    )
}

async fn handle_upload(
    State(app): State<ServerState>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    while let Ok(Some(field)) = multipart.next_field().await {
        if field.name() == Some("file") {
            let content_type = field.content_type().unwrap_or("image/jpeg").to_string();

            if let Ok(bytes) = field.bytes().await {
                let base64_string = base64::engine::general_purpose::STANDARD.encode(&bytes);

                let payload = serde_json::json!({
                    "mime": content_type,
                    "data": base64_string
                });

                let _ = app.emit("scan-received", payload);
                return (StatusCode::OK, "Uploaded");
            }
        }
    }

    (StatusCode::BAD_REQUEST, "No file found")
}

async fn handle_oauth(
    State(app): State<ServerState>,
    Query(params): Query<OAuthQuery>,
) -> impl IntoResponse {
    let _ = app.emit("oauth-code-received", params.code);

    Html(
        r#"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Successful</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex; justify-content: center; align-items: center; min-height: 100vh;
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            overflow: hidden;
        }
        .container {
            text-align: center; background: rgba(255, 255, 255, 0.95); padding: 3rem 4rem;
            border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        .checkmark {
            width: 80px; height: 80px; border-radius: 50%; display: inline-block;
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            position: relative; margin-bottom: 1.5rem; animation: scaleIn 0.5s ease-out 0.2s both;
        }
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
        .checkmark::after {
            content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            color: white; font-size: 3rem; font-weight: bold;
        }
        h1 { color: #2d3748; font-size: 2rem; margin-bottom: 1rem; font-weight: 700; }
        p { color: #4a5568; font-size: 1.125rem; line-height: 1.6; margin-bottom: 0.5rem; }
        .auto-close { color: #718096; font-size: 0.875rem; margin-top: 1.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="checkmark"></div>
        <h1>Authentication Successful!</h1>
        <p>You have been successfully authenticated.</p>
        <p class="auto-close">You may now close this window.</p>
    </div>
</body>
</html>
    "#,
    )
}
