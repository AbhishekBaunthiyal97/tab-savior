# TabSavior Privacy Policy

## Overview

TabSavior is a browser extension designed to help users save and restore their browser tabs while maintaining login states. This privacy policy explains how TabSavior handles user data.

## Data Collection and Usage

### What information do we collect?

TabSavior collects and stores the following information:

- URLs of your open tabs when you choose to save them
- Cookies associated with those tabs (to maintain login states)
- Names, tags, and notes that you provide for your saved tab groups
- Extension settings and preferences

### Where is this information stored?

All data collected by TabSavior is stored locally on your device using Chrome's built-in storage APIs:
- `chrome.storage.sync` - For syncing your saved sessions across devices (if you're signed into Chrome)
- `chrome.storage.local` - As a fallback when sync storage limits are exceeded

### Do we share your data?

**No.** TabSavior does not transmit your data to any external servers. All data remains on your local device or within your Chrome sync account.

## Permissions Explained

TabSavior requires the following permissions:

- **tabs**: To access and manage your open tabs
- **storage**: To save your tab sessions locally
- **downloads**: To allow exporting your saved sessions
- **debugger**: Used solely to access HttpOnly cookies for preserving login states

## Data Security

We take security seriously. TabSavior:

- Does not send your data to any servers
- Only stores data locally on your device
- Uses Chrome's secure storage APIs

## Data Removal

To remove all data stored by TabSavior:
1. Open Chrome's Extensions page (chrome://extensions/)
2. Find TabSavior and click "Remove"
3. Check the option to clear all data related to the extension

## Changes to This Policy

We may update our Privacy Policy from time to time. We will notify users of any changes by updating the date at the top of this policy.

## Contact Us

If you have any questions about this Privacy Policy, please contact us at [your-email@example.com].

Last updated: March 19, 2023 