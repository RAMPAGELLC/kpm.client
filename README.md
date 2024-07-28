# KPM Client
KPM Client is a CLI written in TypeScript for the popular Roblox Framework Knight by RAMPAGE Interactive. You can use the KPM Client to install Knight packages such as Maid.

# Install
See https://github.com/RAMPAGELLC/kpm.client/blob/main/INSTALL.md

# Documentation
See https://github.com/RAMPAGELLC/kpm.client/blob/main/DOCUMENTATION.md

## Additional Information
- **Ensure you are running KPM within the Project Root!**
- Ensure you have the necessary permissions to write to the directories where packages are being installed.
- The `manifest.lua` file will be created in the package directory after installation.


# Disclaimer
The software is provided "as is," without any warranty of any kind. We are not responsible for any damages to your project or system caused by the use or misuse of this software. Use it at your own risk.

# Dependacies:
* ``figlet``; Used for KPM text
* ``commander``; Used for CLI command parsing
* ``axios``;  Used for API requests
* ``fs``; Used for installation/uninstallation of packages and getting manifests
* ``path``; Used for installation/uninstallation of packages and getting manifests
* ``unzipper``; Used for installation/uninstallation of packages and getting manifests
* ``chalk``; Used to spark up CLI
* ``progress``; Progress bar for operations
* ``open``; Used to open URL in browser to publish packages and authenticate
* ``express``; Used for authentication callback
* ``config``; Used to store configuration