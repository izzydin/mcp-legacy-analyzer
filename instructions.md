# Claude Desktop Setup

To run your new `mcp-legacy-analyzer` server in Claude Desktop, you'll need to update the `claude_desktop_config.json` file.

## Configuration JSON

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "legacy-analyzer": {
      "command": "npx",
      "args": [
        "--prefix",
        "C:\\Users\\MI EQUIPO\\Projects\\MCP-legacy-analyzer\\mcp-legacy-analyzer",
        "ts-node",
        "--esm",
        "C:\\Users\\MI EQUIPO\\Projects\\MCP-legacy-analyzer\\mcp-legacy-analyzer\\src\\index.ts"
      ]
    }
  }
}
```

## Step-by-Step Guide

### For Windows:
1. Open **File Explorer**.
2. In the address bar, type `%APPDATA%\Claude` and press **Enter**.
3. Look for the file named `claude_desktop_config.json`. If it doesn't exist, right-click -> New -> Text Document, and name it `claude_desktop_config.json` (make sure it doesn't end in `.txt`).
4. Open the file in a text editor like VS Code or Notepad.
5. Paste the JSON configuration provided above (if you already have other `mcpServers`, merge `legacy-analyzer` into the existing object).
6. Save the file.
7. Restart the Claude Desktop application so it picks up the new MCP server.

### For macOS:
1. Open your **Terminal** application.
2. Open the Claude config directory by running:
   `open "~/Library/Application Support/Claude"`
3. Look for the file `claude_desktop_config.json`. If it's missing, create a new file with that name.
4. Open the file in your preferred code editor.
5. Paste the JSON configuration provided above. *(Note: If you move this project to a macOS machine, make sure to update the absolute paths in the JSON appropriately).*
6. Save the file.
7. Quit completely and reopen the Claude Desktop application.
