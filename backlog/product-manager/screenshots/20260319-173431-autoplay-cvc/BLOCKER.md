Attempted screenshot capture for computer-vs-computer autoplay.

1) Playwright MCP browser launch
- Error: Opening in existing browser session

2) Edge headless screenshot
Command:
msedge.exe --headless --disable-gpu --user-data-dir=<local folder> --window-size=390,844 --screenshot=<file> about:blank

Observed errors:
- CreateFile: Access is denied. (0x5)
- FATAL platform_channel.cc: Access is denied. (0x5)
- Failed to grant sandbox access to profile/cache/network directories.

Result: No screenshot files were generated in this environment.
