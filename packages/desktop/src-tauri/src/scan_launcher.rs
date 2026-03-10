use serde::{Deserialize, Serialize};
use std::process::Command;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ScanError {
    #[error("Tool not found: {0}")]
    ToolNotFound(String),
    #[error("Launch failed: {0}")]
    LaunchFailed(String),
    #[error("Project path required for IDE tools")]
    ProjectRequired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanLaunchResult {
    pub launched: bool,
    pub direct: bool,
    pub message: String,
    pub tool_id: String,
    pub project_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchableTool {
    pub id: String,
    pub name: String,
    pub direct: bool,
    pub available: bool,
}

/// Check if a binary exists in PATH
fn binary_exists(name: &str) -> bool {
    #[cfg(target_os = "windows")]
    let cmd = "where";
    #[cfg(not(target_os = "windows"))]
    let cmd = "which";

    Command::new(cmd)
        .arg(name)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Launch a scan for a specific tool
pub fn launch_scan(tool_id: &str, project_path: &str) -> Result<ScanLaunchResult, ScanError> {
    match tool_id {
        // CLI tools - direct scan launch
        "claude" => {
            if !binary_exists("claude") {
                return Err(ScanError::ToolNotFound("claude".to_string()));
            }
            Command::new("claude")
                .args(["-p", project_path, "--message", "/snitch"])
                .spawn()
                .map_err(|e| ScanError::LaunchFailed(e.to_string()))?;

            Ok(ScanLaunchResult {
                launched: true,
                direct: true,
                message: "Claude Code scan launched. Check your terminal for progress.".to_string(),
                tool_id: tool_id.to_string(),
                project_path: project_path.to_string(),
            })
        }
        "gemini" => {
            if !binary_exists("gemini") {
                return Err(ScanError::ToolNotFound("gemini".to_string()));
            }
            Command::new("gemini")
                .args(["--project", project_path, "--message", "/snitch"])
                .spawn()
                .map_err(|e| ScanError::LaunchFailed(e.to_string()))?;

            Ok(ScanLaunchResult {
                launched: true,
                direct: true,
                message: "Gemini CLI scan launched. Check your terminal for progress.".to_string(),
                tool_id: tool_id.to_string(),
                project_path: project_path.to_string(),
            })
        }
        "codex" => {
            if !binary_exists("codex") {
                return Err(ScanError::ToolNotFound("codex".to_string()));
            }
            Command::new("codex")
                .args(["--project", project_path, "--message", "/snitch"])
                .spawn()
                .map_err(|e| ScanError::LaunchFailed(e.to_string()))?;

            Ok(ScanLaunchResult {
                launched: true,
                direct: true,
                message: "Codex CLI scan launched. Check your terminal for progress.".to_string(),
                tool_id: tool_id.to_string(),
                project_path: project_path.to_string(),
            })
        }
        "copilot-cli" => {
            if !binary_exists("copilot") {
                return Err(ScanError::ToolNotFound("copilot".to_string()));
            }
            Command::new("copilot")
                .args(["--project", project_path, "--message", "/snitch"])
                .spawn()
                .map_err(|e| ScanError::LaunchFailed(e.to_string()))?;

            Ok(ScanLaunchResult {
                launched: true,
                direct: true,
                message: "Copilot CLI scan launched. Check your terminal for progress.".to_string(),
                tool_id: tool_id.to_string(),
                project_path: project_path.to_string(),
            })
        }
        "aider" => {
            if !binary_exists("aider") {
                return Err(ScanError::ToolNotFound("aider".to_string()));
            }
            Command::new("aider")
                .args(["--message", "/snitch"])
                .current_dir(project_path)
                .spawn()
                .map_err(|e| ScanError::LaunchFailed(e.to_string()))?;

            Ok(ScanLaunchResult {
                launched: true,
                direct: true,
                message: "Aider scan launched. Check your terminal for progress.".to_string(),
                tool_id: tool_id.to_string(),
                project_path: project_path.to_string(),
            })
        }

        // IDE tools - open project, user must trigger scan manually
        "cursor" => {
            let binary = if binary_exists("cursor") {
                "cursor"
            } else {
                return Err(ScanError::ToolNotFound("cursor".to_string()));
            };
            Command::new(binary)
                .arg(project_path)
                .spawn()
                .map_err(|e| ScanError::LaunchFailed(e.to_string()))?;

            Ok(ScanLaunchResult {
                launched: true,
                direct: false,
                message: "Cursor opened. Type /snitch in the AI chat to start the scan."
                    .to_string(),
                tool_id: tool_id.to_string(),
                project_path: project_path.to_string(),
            })
        }
        "windsurf" => {
            if !binary_exists("windsurf") {
                return Err(ScanError::ToolNotFound("windsurf".to_string()));
            }
            Command::new("windsurf")
                .arg(project_path)
                .spawn()
                .map_err(|e| ScanError::LaunchFailed(e.to_string()))?;

            Ok(ScanLaunchResult {
                launched: true,
                direct: false,
                message: "Windsurf opened. Type /snitch in the AI chat to start the scan."
                    .to_string(),
                tool_id: tool_id.to_string(),
                project_path: project_path.to_string(),
            })
        }
        "zed" => {
            if !binary_exists("zed") {
                return Err(ScanError::ToolNotFound("zed".to_string()));
            }
            Command::new("zed")
                .arg(project_path)
                .spawn()
                .map_err(|e| ScanError::LaunchFailed(e.to_string()))?;

            Ok(ScanLaunchResult {
                launched: true,
                direct: false,
                message: "Zed opened. Type /snitch in the AI chat to start the scan.".to_string(),
                tool_id: tool_id.to_string(),
                project_path: project_path.to_string(),
            })
        }
        "copilot-vscode" | "cline" | "kilo" | "roo" | "continue" => {
            if !binary_exists("code") {
                return Err(ScanError::ToolNotFound("code (VS Code)".to_string()));
            }
            Command::new("code")
                .arg(project_path)
                .spawn()
                .map_err(|e| ScanError::LaunchFailed(e.to_string()))?;

            let tool_name = match tool_id {
                "copilot-vscode" => "GitHub Copilot",
                "cline" => "Cline",
                "kilo" => "Kilo Code",
                "roo" => "Roo Code",
                "continue" => "Continue.dev",
                _ => "the AI extension",
            };

            Ok(ScanLaunchResult {
                launched: true,
                direct: false,
                message: format!(
                    "VS Code opened. Type /snitch in {} to start the scan.",
                    tool_name
                ),
                tool_id: tool_id.to_string(),
                project_path: project_path.to_string(),
            })
        }

        _ => Err(ScanError::ToolNotFound(tool_id.to_string())),
    }
}

/// Get all tools that can be used for launching scans
pub fn get_launchable_tools(project_path: &str) -> Vec<LaunchableTool> {
    let _project = std::path::Path::new(project_path);

    vec![
        LaunchableTool {
            id: "claude".to_string(),
            name: "Claude Code".to_string(),
            direct: true,
            available: binary_exists("claude"),
        },
        LaunchableTool {
            id: "gemini".to_string(),
            name: "Gemini CLI".to_string(),
            direct: true,
            available: binary_exists("gemini"),
        },
        LaunchableTool {
            id: "codex".to_string(),
            name: "Codex CLI".to_string(),
            direct: true,
            available: binary_exists("codex"),
        },
        LaunchableTool {
            id: "copilot-cli".to_string(),
            name: "Copilot CLI".to_string(),
            direct: true,
            available: binary_exists("copilot"),
        },
        LaunchableTool {
            id: "aider".to_string(),
            name: "Aider".to_string(),
            direct: true,
            available: binary_exists("aider"),
        },
        LaunchableTool {
            id: "cursor".to_string(),
            name: "Cursor".to_string(),
            direct: false,
            available: binary_exists("cursor"),
        },
        LaunchableTool {
            id: "windsurf".to_string(),
            name: "Windsurf".to_string(),
            direct: false,
            available: binary_exists("windsurf"),
        },
        LaunchableTool {
            id: "zed".to_string(),
            name: "Zed".to_string(),
            direct: false,
            available: binary_exists("zed"),
        },
        LaunchableTool {
            id: "copilot-vscode".to_string(),
            name: "GitHub Copilot (VS Code)".to_string(),
            direct: false,
            available: binary_exists("code"),
        },
        LaunchableTool {
            id: "cline".to_string(),
            name: "Cline (VS Code)".to_string(),
            direct: false,
            available: binary_exists("code"),
        },
        LaunchableTool {
            id: "kilo".to_string(),
            name: "Kilo Code (VS Code)".to_string(),
            direct: false,
            available: binary_exists("code"),
        },
        LaunchableTool {
            id: "roo".to_string(),
            name: "Roo Code (VS Code)".to_string(),
            direct: false,
            available: binary_exists("code"),
        },
        LaunchableTool {
            id: "continue".to_string(),
            name: "Continue.dev (VS Code)".to_string(),
            direct: false,
            available: binary_exists("code"),
        },
    ]
}
