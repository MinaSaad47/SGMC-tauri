use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::time::Duration;

/// Starts a local OAuth server to handle authorization code callbacks.
///
/// This server listens on localhost at the specified port and waits for an OAuth
/// redirect containing the authorization code. Once received, it sends a success
/// page to the browser and returns the code to the application.
///
/// # Arguments
/// * `port` - The port number to bind the server to
/// * `timeout_seconds` - Optional timeout in seconds (defaults to 300 seconds / 5 minutes)
#[tauri::command]
pub async fn start_oauth_server(port: u16, timeout_seconds: Option<u64>) -> Result<String, String> {
    let timeout = Duration::from_secs(timeout_seconds.unwrap_or(300));

    // Use tokio::time::timeout to wrap the entire operation
    tokio::time::timeout(timeout, async move {
        let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
            .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?;

        // Set a timeout for the accept operation
        listener
            .set_nonblocking(false)
            .map_err(|e| format!("Failed to set blocking mode: {}", e))?;

        // Accept only one connection (the OAuth redirect)
        if let Ok((mut stream, _)) = listener.accept() {
            let mut reader = BufReader::new(&stream);
            let mut request_line = String::new();
            reader
                .read_line(&mut request_line)
                .map_err(|e| e.to_string())?;

            // Extract the authorization code from the GET request
            // Expected format: "GET /?code=... HTTP/1.1"
            let url_part = request_line
                .split_whitespace()
                .nth(1)
                .ok_or("Invalid request")?;

            // Parse the authorization code parameter
            // URL format: /?state=...&code=4/0A...&scope=...
            let code = url_part
                .split('&')
                .find(|part| part.starts_with("code=") || part.contains("?code="))
                .and_then(|part| part.split('=').nth(1))
                .ok_or("No code found in request")?
                .to_string();

            // Send a beautiful success page to the browser
            let response = get_success_html();

            stream
                .write_all(response.as_bytes())
                .map_err(|e| e.to_string())?;

            return Ok(code);
        }

        Err("Server stopped without receiving code".to_string())
    })
    .await
    .map_err(|_| "OAuth server timed out waiting for authorization code".to_string())?
}

/// Returns a beautiful HTML success page for OAuth authentication
fn get_success_html() -> &'static str {
    r#"HTTP/1.1 200 OK
Content-Type: text/html


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Successful</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            overflow: hidden;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            padding: 3rem 4rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: inline-block;
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            position: relative;
            margin-bottom: 1.5rem;
            animation: scaleIn 0.5s ease-out 0.2s both;
        }
        @keyframes scaleIn {
            from {
                transform: scale(0);
            }
            to {
                transform: scale(1);
            }
        }
        .checkmark::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 3rem;
            font-weight: bold;
        }
        h1 {
            color: #2d3748;
            font-size: 2rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        p {
            color: #4a5568;
            font-size: 1.125rem;
            line-height: 1.6;
            margin-bottom: 0.5rem;
        }
        .auto-close {
            color: #718096;
            font-size: 0.875rem;
            margin-top: 1.5rem;
        }
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
</html>"#
}
