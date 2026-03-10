use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;
use thiserror::Error;
use walkdir::WalkDir;

#[derive(Error, Debug)]
pub enum PluginError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Tool not supported: {0}")]
    UnsupportedTool(String),
    #[error("Project path required for this tool")]
    ProjectRequired,
    #[error("Resource not found: {0}")]
    ResourceNotFound(String),
}

/// Resolve the bundled skill resource directory from the Tauri app handle
fn get_resource_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, PluginError> {
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| PluginError::ResourceNotFound(e.to_string()))?
        .join("resources")
        .join("skill");

    if !resource_path.exists() {
        return Err(PluginError::ResourceNotFound(format!(
            "Skill resources not found at: {}",
            resource_path.display()
        )));
    }

    Ok(resource_path)
}

/// Get the install target directory for a given tool
fn get_install_path(
    tool_id: &str,
    project_path: Option<&str>,
) -> Result<PathBuf, PluginError> {
    let home = dirs::home_dir()
        .ok_or(PluginError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Could not determine home directory",
        )))?;

    match tool_id {
        // CLI tools (global paths)
        "claude" => Ok(home.join(".claude").join("plugins").join("snitch")),
        "gemini" => Ok(home.join(".gemini").join("extensions").join("snitch")),
        "codex" => Ok(home.join(".codex").join("plugins").join("snitch")),
        "copilot-cli" => Ok(home.join(".copilot").join("plugins").join("snitch")),

        // IDE tools (project-local paths)
        "cursor" | "windsurf" | "cline" | "kilo" | "roo" | "zed" | "copilot-vscode" | "aider"
        | "continue" => {
            let project = project_path.ok_or(PluginError::ProjectRequired)?;
            let base = Path::new(project);

            match tool_id {
                "cursor" => Ok(base.join(".cursor").join("rules").join("snitch")),
                "windsurf" => Ok(base.join(".windsurf").join("rules").join("snitch")),
                "cline" => Ok(base.join(".clinerules").join("snitch")),
                "kilo" => Ok(base.join(".kilocode").join("rules").join("snitch")),
                "roo" => Ok(base.join(".roo").join("rules").join("snitch")),
                "zed" => Ok(base.join(".rules").join("snitch")),
                "copilot-vscode" => Ok(base.join(".github")),
                "aider" => Ok(base.join(".snitch")),
                "continue" => Ok(base.join(".snitch")),
                _ => unreachable!(),
            }
        }

        _ => Err(PluginError::UnsupportedTool(tool_id.to_string())),
    }
}

/// Prepend a watermark comment to content if a watermark is provided
fn watermark_content(content: &str, watermark: Option<&str>) -> String {
    match watermark {
        Some(wm) => format!("<!-- snitch:{} -->\n{}", wm, content),
        None => content.to_string(),
    }
}

/// Copy all skill files from source directory to target directory
fn copy_skill_files(
    source_dir: &Path,
    target_dir: &Path,
    watermark: Option<&str>,
) -> Result<(), PluginError> {
    fs::create_dir_all(target_dir)?;

    for entry in WalkDir::new(source_dir).into_iter().filter_map(|e| e.ok()) {
        let source_path = entry.path();
        let relative = source_path
            .strip_prefix(source_dir)
            .unwrap_or(source_path);

        if relative.as_os_str().is_empty() {
            continue;
        }

        let target_path = target_dir.join(relative);

        if source_path.is_dir() {
            fs::create_dir_all(&target_path)?;
        } else if source_path.is_file() {
            if let Some(parent) = target_path.parent() {
                fs::create_dir_all(parent)?;
            }

            // Watermark markdown files
            if source_path
                .extension()
                .map(|e| e == "md")
                .unwrap_or(false)
            {
                let content = fs::read_to_string(source_path)?;
                let watermarked = watermark_content(&content, watermark);
                fs::write(&target_path, watermarked)?;
            } else {
                fs::copy(source_path, &target_path)?;
            }
        }
    }

    Ok(())
}

/// Install skill files for Copilot VS Code (special layout)
fn install_copilot_vscode(
    source_dir: &Path,
    project_path: &str,
    watermark: Option<&str>,
) -> Result<String, PluginError> {
    let base = Path::new(project_path);
    let github_dir = base.join(".github");
    fs::create_dir_all(&github_dir)?;

    // Copy main SKILL.md as copilot-instructions.md
    let skill_md = source_dir.join("SKILL.md");
    if skill_md.exists() {
        let content = fs::read_to_string(&skill_md)?;
        let watermarked = watermark_content(&content, watermark);
        fs::write(github_dir.join("copilot-instructions.md"), watermarked)?;
    }

    // Copy categories as .instructions.md files
    let categories_dir = source_dir.join("categories");
    if categories_dir.exists() {
        let instructions_dir = github_dir.join("instructions").join("snitch");
        fs::create_dir_all(&instructions_dir)?;

        for entry in WalkDir::new(&categories_dir)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if path.is_file()
                && path
                    .extension()
                    .map(|e| e == "md")
                    .unwrap_or(false)
            {
                let content = fs::read_to_string(path)?;
                let watermarked = watermark_content(&content, watermark);
                let filename = path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy();
                let target_name = format!("{}.instructions.md", filename);
                fs::write(instructions_dir.join(target_name), watermarked)?;
            }
        }
    }

    Ok(github_dir.to_string_lossy().to_string())
}

/// Install skill files for Aider (creates/updates .aider.conf.yml)
fn install_aider(
    source_dir: &Path,
    project_path: &str,
    watermark: Option<&str>,
) -> Result<String, PluginError> {
    let base = Path::new(project_path);
    let snitch_dir = base.join(".snitch");

    // Copy skill files
    copy_skill_files(source_dir, &snitch_dir, watermark)?;

    // Create or update .aider.conf.yml
    let aider_conf = base.join(".aider.conf.yml");
    let read_line = "read:\n  - .snitch/SKILL.md";

    if aider_conf.exists() {
        let content = fs::read_to_string(&aider_conf)?;
        if !content.contains(".snitch/SKILL.md") {
            let updated = format!("{}\n{}\n", content.trim_end(), read_line);
            fs::write(&aider_conf, updated)?;
        }
    } else {
        fs::write(&aider_conf, format!("{}\n", read_line))?;
    }

    Ok(snitch_dir.to_string_lossy().to_string())
}

/// Install skill files for Continue.dev (creates .continuerc.json)
fn install_continue(
    source_dir: &Path,
    project_path: &str,
    watermark: Option<&str>,
) -> Result<String, PluginError> {
    let base = Path::new(project_path);
    let snitch_dir = base.join(".snitch");

    // Copy skill files
    copy_skill_files(source_dir, &snitch_dir, watermark)?;

    // Create or update .continuerc.json
    let continuerc = base.join(".continuerc.json");
    let skill_path = ".snitch/SKILL.md";

    if continuerc.exists() {
        let content = fs::read_to_string(&continuerc)?;
        if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(&content) {
            // Add or update customInstructions
            if let Some(obj) = json.as_object_mut() {
                let instructions = format!("Follow security audit instructions in {}", skill_path);
                obj.insert(
                    "customInstructions".to_string(),
                    serde_json::Value::String(instructions),
                );
            }
            fs::write(&continuerc, serde_json::to_string_pretty(&json)?)?;
        }
    } else {
        let config = serde_json::json!({
            "customInstructions": format!("Follow security audit instructions in {}", skill_path)
        });
        fs::write(&continuerc, serde_json::to_string_pretty(&config)?)?;
    }

    Ok(snitch_dir.to_string_lossy().to_string())
}

/// Install the snitch skill for a specific tool
pub fn install_skill(
    app_handle: &tauri::AppHandle,
    tool_id: &str,
    project_path: Option<&str>,
    watermark: Option<&str>,
) -> Result<String, PluginError> {
    let source_dir = get_resource_dir(app_handle)?;

    // Handle special tool layouts
    match tool_id {
        "copilot-vscode" => {
            let project = project_path.ok_or(PluginError::ProjectRequired)?;
            return install_copilot_vscode(&source_dir, project, watermark);
        }
        "aider" => {
            let project = project_path.ok_or(PluginError::ProjectRequired)?;
            return install_aider(&source_dir, project, watermark);
        }
        "continue" => {
            let project = project_path.ok_or(PluginError::ProjectRequired)?;
            return install_continue(&source_dir, project, watermark);
        }
        _ => {}
    }

    // Standard install: copy skill files to target directory
    let target_dir = get_install_path(tool_id, project_path)?;
    copy_skill_files(&source_dir, &target_dir, watermark)?;

    Ok(target_dir.to_string_lossy().to_string())
}

/// Uninstall the snitch skill for a specific tool
pub fn uninstall_skill(
    tool_id: &str,
    project_path: Option<&str>,
) -> Result<(), PluginError> {
    match tool_id {
        "copilot-vscode" => {
            let project = project_path.ok_or(PluginError::ProjectRequired)?;
            let base = Path::new(project);

            // Remove copilot-instructions.md
            let instructions_file = base.join(".github").join("copilot-instructions.md");
            if instructions_file.exists() {
                fs::remove_file(&instructions_file)?;
            }

            // Remove .github/instructions/snitch/ directory
            let snitch_instructions = base.join(".github").join("instructions").join("snitch");
            if snitch_instructions.exists() {
                fs::remove_dir_all(&snitch_instructions)?;
            }

            return Ok(());
        }
        "aider" => {
            let project = project_path.ok_or(PluginError::ProjectRequired)?;
            let base = Path::new(project);

            // Remove .snitch directory
            let snitch_dir = base.join(".snitch");
            if snitch_dir.exists() {
                fs::remove_dir_all(&snitch_dir)?;
            }

            // Remove read entry from .aider.conf.yml
            let aider_conf = base.join(".aider.conf.yml");
            if aider_conf.exists() {
                let content = fs::read_to_string(&aider_conf)?;
                let cleaned: String = content
                    .lines()
                    .filter(|line| !line.contains(".snitch/SKILL.md"))
                    .collect::<Vec<_>>()
                    .join("\n");
                let cleaned = cleaned.replace("read:\n\n", "");
                if cleaned.trim().is_empty() || cleaned.trim() == "read:" {
                    fs::remove_file(&aider_conf)?;
                } else {
                    fs::write(&aider_conf, cleaned)?;
                }
            }

            return Ok(());
        }
        "continue" => {
            let project = project_path.ok_or(PluginError::ProjectRequired)?;
            let base = Path::new(project);

            // Remove .snitch directory
            let snitch_dir = base.join(".snitch");
            if snitch_dir.exists() {
                fs::remove_dir_all(&snitch_dir)?;
            }

            // Remove customInstructions from .continuerc.json
            let continuerc = base.join(".continuerc.json");
            if continuerc.exists() {
                let content = fs::read_to_string(&continuerc)?;
                if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(obj) = json.as_object_mut() {
                        obj.remove("customInstructions");
                    }
                    if json.as_object().map(|o| o.is_empty()).unwrap_or(true) {
                        fs::remove_file(&continuerc)?;
                    } else {
                        fs::write(&continuerc, serde_json::to_string_pretty(&json)?)?;
                    }
                }
            }

            return Ok(());
        }
        _ => {}
    }

    // Standard uninstall: remove the snitch directory
    let target_dir = get_install_path(tool_id, project_path)?;
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir)?;
    }

    Ok(())
}
