use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ToolType {
    Cli,
    Ide,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolInfo {
    pub id: String,
    pub name: String,
    pub tool_type: ToolType,
    pub detected: bool,
    pub snitch_loaded: bool,
    pub install_path: Option<String>,
}

/// Check if a binary exists in PATH
fn binary_in_path(name: &str) -> bool {
    #[cfg(target_os = "windows")]
    let cmd = "where";
    #[cfg(not(target_os = "windows"))]
    let cmd = "which";

    std::process::Command::new(cmd)
        .arg(name)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Check if a directory exists
fn dir_exists(path: &Path) -> bool {
    path.is_dir()
}

/// Check if a file exists
fn file_exists(path: &Path) -> bool {
    path.is_file()
}

/// Check if a macOS app bundle exists in /Applications
#[cfg(target_os = "macos")]
fn app_installed(app_name: &str) -> bool {
    Path::new(&format!("/Applications/{}.app", app_name)).exists()
}

#[cfg(not(target_os = "macos"))]
fn app_installed(_app_name: &str) -> bool {
    false
}

/// Check if a VS Code extension is installed
fn vscode_extension_installed(extension_id: &str) -> bool {
    if let Some(home) = dirs::home_dir() {
        let extensions_dir = home.join(".vscode").join("extensions");
        if extensions_dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&extensions_dir) {
                for entry in entries.flatten() {
                    let name = entry.file_name().to_string_lossy().to_lowercase();
                    if name.starts_with(&extension_id.to_lowercase()) {
                        return true;
                    }
                }
            }
        }
    }
    false
}

/// Detect a CLI tool (global install)
fn detect_cli_tool(
    id: &str,
    name: &str,
    config_dir: &str,
    binary_name: &str,
    skill_subpath: &str,
) -> ToolInfo {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return ToolInfo {
            id: id.to_string(),
            name: name.to_string(),
            tool_type: ToolType::Cli,
            detected: false,
            snitch_loaded: false,
            install_path: None,
        },
    };
    let config_path = home.join(config_dir);
    let detected = dir_exists(&config_path) || binary_in_path(binary_name);
    let install_path = home.join(config_dir).join(skill_subpath);
    let snitch_loaded = file_exists(&install_path.join("SKILL.md"));

    ToolInfo {
        id: id.to_string(),
        name: name.to_string(),
        tool_type: ToolType::Cli,
        detected,
        snitch_loaded,
        install_path: Some(install_path.to_string_lossy().to_string()),
    }
}

/// Detect an IDE tool that uses project-local config
fn detect_ide_tool_for_projects(
    id: &str,
    name: &str,
    is_installed: bool,
    project_paths: &[String],
    project_subdir: &str,
) -> Vec<ToolInfo> {
    if project_paths.is_empty() {
        return vec![ToolInfo {
            id: id.to_string(),
            name: name.to_string(),
            tool_type: ToolType::Ide,
            detected: is_installed,
            snitch_loaded: false,
            install_path: None,
        }];
    }

    project_paths
        .iter()
        .map(|project_path| {
            let install_path = Path::new(project_path).join(project_subdir);
            let snitch_loaded = file_exists(&install_path.join("SKILL.md"));

            ToolInfo {
                id: id.to_string(),
                name: name.to_string(),
                tool_type: ToolType::Ide,
                detected: is_installed,
                snitch_loaded,
                install_path: Some(install_path.to_string_lossy().to_string()),
            }
        })
        .collect()
}

/// Detect Copilot VS Code (special layout with copilot-instructions.md)
fn detect_copilot_vscode_for_projects(
    project_paths: &[String],
) -> Vec<ToolInfo> {
    let is_installed = app_installed("Visual Studio Code")
        || binary_in_path("code")
        || vscode_extension_installed("github.copilot");

    if project_paths.is_empty() {
        return vec![ToolInfo {
            id: "copilot-vscode".to_string(),
            name: "GitHub Copilot (VS Code)".to_string(),
            tool_type: ToolType::Ide,
            detected: is_installed,
            snitch_loaded: false,
            install_path: None,
        }];
    }

    project_paths
        .iter()
        .map(|project_path| {
            let install_path = Path::new(project_path).join(".github");
            let snitch_loaded = file_exists(&install_path.join("copilot-instructions.md"));

            ToolInfo {
                id: "copilot-vscode".to_string(),
                name: "GitHub Copilot (VS Code)".to_string(),
                tool_type: ToolType::Ide,
                detected: is_installed,
                snitch_loaded,
                install_path: Some(install_path.to_string_lossy().to_string()),
            }
        })
        .collect()
}

/// Detect all supported AI coding tools
pub fn detect_all_tools(project_paths: &[String]) -> Vec<ToolInfo> {
    let mut tools = Vec::new();

    // CLI tools (global install paths)
    tools.push(detect_cli_tool(
        "claude",
        "Claude Code",
        ".claude",
        "claude",
        "plugins/snitch",
    ));
    tools.push(detect_cli_tool(
        "gemini",
        "Gemini CLI",
        ".gemini",
        "gemini",
        "extensions/snitch",
    ));
    tools.push(detect_cli_tool(
        "codex",
        "Codex CLI",
        ".codex",
        "codex",
        "plugins/snitch",
    ));
    tools.push(detect_cli_tool(
        "copilot-cli",
        "Copilot CLI",
        ".copilot",
        "copilot",
        "plugins/snitch",
    ));

    // IDE tools (project-local config)
    let cursor_installed = app_installed("Cursor")
        || dirs::home_dir()
            .map(|h| dir_exists(&h.join(".cursor")))
            .unwrap_or(false);
    tools.extend(detect_ide_tool_for_projects(
        "cursor",
        "Cursor",
        cursor_installed,
        project_paths,
        ".cursor/rules/snitch",
    ));

    let windsurf_installed = app_installed("Windsurf");
    tools.extend(detect_ide_tool_for_projects(
        "windsurf",
        "Windsurf",
        windsurf_installed,
        project_paths,
        ".windsurf/rules/snitch",
    ));

    let cline_installed = vscode_extension_installed("saoudrizwan.claude-dev");
    tools.extend(detect_ide_tool_for_projects(
        "cline",
        "Cline",
        cline_installed,
        project_paths,
        ".clinerules/snitch",
    ));

    let kilo_installed = vscode_extension_installed("kilocode.kilo-code");
    tools.extend(detect_ide_tool_for_projects(
        "kilo",
        "Kilo Code",
        kilo_installed,
        project_paths,
        ".kilocode/rules/snitch",
    ));

    let roo_installed = vscode_extension_installed("rooveterinaryinc.roo-cline");
    tools.extend(detect_ide_tool_for_projects(
        "roo",
        "Roo Code",
        roo_installed,
        project_paths,
        ".roo/rules/snitch",
    ));

    let zed_installed = app_installed("Zed") || binary_in_path("zed");
    tools.extend(detect_ide_tool_for_projects(
        "zed",
        "Zed",
        zed_installed,
        project_paths,
        ".rules/snitch",
    ));

    // Copilot VS Code (special layout)
    tools.extend(detect_copilot_vscode_for_projects(project_paths));

    // Aider
    let aider_installed = binary_in_path("aider");
    tools.extend(detect_ide_tool_for_projects(
        "aider",
        "Aider",
        aider_installed,
        project_paths,
        ".snitch",
    ));

    // Continue.dev
    let continue_installed = vscode_extension_installed("continue.continue");
    tools.extend(detect_ide_tool_for_projects(
        "continue",
        "Continue.dev",
        continue_installed,
        project_paths,
        ".snitch",
    ));

    tools
}
