# Tab Session Saver Chrome Extension

A powerful Chrome extension that allows you to save and restore groups of browser tabs while preserving their login states. Never lose your work sessions again!

## Features

- Save multiple tab groups with their URLs and cookies
- Restore tab groups with login states intact
- Manage tab groups (save, restore, delete, update) via an intuitive popup interface
- Option to automatically restore a default tab group on browser startup
- Preserves HttpOnly cookies using Chrome's debugger API

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. To save current tabs:
   - Click "Save Current Tabs"
   - Enter a name for your tab group
3. To restore tabs:
   - Select a saved group from the list
   - Click "Restore"
4. To manage groups:
   - Use the delete or update buttons next to each group
5. Configure auto-restore in the options page

## Security

- All data is stored locally in your browser
- No data is sent to external servers
- Uses Chrome's secure APIs for cookie management

## Development

To set up the development environment:

1. Clone the repository
2. Make your changes
3. Test the extension locally
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 