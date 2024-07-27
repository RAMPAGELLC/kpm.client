# KPM Client
KPM Client is a CLI written in TypeScript for the popular Roblox Framework Knight by RAMPAGE Interactive. You can use the KPM Client to install Knight packages such as Maid.

# Usage
First, ensure you have Node.js and npm installed. Then, install the required packages:

## How do I fix PowerShell Execution Policy?
*Documentation soon.*

## How do I change KPM Installation location?
On Windows Command Prompt, use:
```
set KPM_INSTALL_LOCATION=C:\path\to\your\desired\location
```

By Default its: current_directory/default_path_to_knight_library

## Update KPM.client
```
kpm npm
```

## Install KPM.client
```
npm install -g kpm.client
```

The KPM CLI supports several commands for managing packages:

### 1. Install a Package

To install a package, use the `install` command with the package name and optionally the version:

```sh
kpm install <package-name> <version>
```

**Example:**

```sh
kpm install my-package 1.0.0
```

If no version is specified, the latest version will be installed:

```sh
kpm install my-package
```

### 2. Uninstall a Package

To uninstall a package, use the `uninstall` command with the package name:

```sh
kpm uninstall <package-name>
```

**Example:**

```sh
kpm uninstall my-package
```

### 3. Update Packages

To update all packages to their latest versions, use the `update` command:

```sh
kpm update
```

To update a specific package to its latest version, specify the package name:

```sh
kpm update <package-name>
```

**Example:**

```sh
kpm update my-package
```

### 4. Output Package Manifest

To display the manifest of a specific package, use the `output-manifest` command with the package name:

```sh
kpm output-manifest <package-name>
```

**Example:**

```sh
kpm output-manifest my-package
```

This will output the contents of `manifest.lua` to the console.

### 5. Check for Package Updates

To check if a new version of a specific package is available, use the `check-update` command with the package name:

```sh
kpm check-update <package-name>
```

**Example:**

```sh
kpm check-update my-package
```

This command will compare the local version with the latest version available and notify you if an update is available.

## Additional Information
- **Ensure you are running KPM within the Project Root!**
- Ensure you have the necessary permissions to write to the directories where packages are being installed.
- The `manifest.lua` file will be created in the package directory after installation.


# Disclaimer
The software is provided "as is," without any warranty of any kind. We are not responsible for any damages to your project or system caused by the use or misuse of this software. Use it at your own risk.

# Dependacies:
* ``figlet``
* ``commander``
* ``axios``
* ``fs``
* ``path``
* ``unzipper``
* ``chalk``
* ``progress``
* ``open``