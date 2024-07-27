
# KPM Client Documentation

The KPM CLI supports several commands for managing packages:

## 1. Install a Package

To install a package, use the `install` command with the package name and optionally the version:

```sh
kpm install <package-name> [version]
```

**Example:**

```sh
kpm install my-package 1.0.0
```

If no version is specified, the latest version will be installed:

```sh
kpm install my-package
```

## 2. Uninstall a Package

To uninstall a package, use the `uninstall` command with the package name:

```sh
kpm uninstall <package-name>
```

**Example:**

```sh
kpm uninstall my-package
```

## 3. Update Packages

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

## 4. Output Package Manifest

To display the manifest of a specific package, use the `output-manifest` command with the package name:

```sh
kpm output-manifest <package-name>
```

**Example:**

```sh
kpm output-manifest my-package
```

This will output the contents of `manifest.lua` to the console.

## 5. Check for Package Updates

To check if a new version of a specific package is available, use the `check-update` command with the package name:

```sh
kpm check-update <package-name>
```

**Example:**

```sh
kpm check-update my-package
```

This command will compare the local version with the latest version available and notify you if an update is available.

## 6. Count Installed Packages

To get the count of installed packages, use the `count` command:

```sh
kpm count
```

## 7. Check All Packages for Updates

To check all installed packages for updates, use the `check-updates` command:

```sh
kpm check-updates
```

## 8. Publish a Package

To open the KPM publish form in your default browser, use the `publish` command:

```sh
kpm publish
```

This will open the KPM publish form at `https://kpm.metatable.dev/publish`.

### Summary

With these commands, you can manage your packages efficiently using the KPM CLI. Each command provides specific functionality to install, uninstall, update, and check the status of your packages, making package management seamless and straightforward.
