// Copyright (c) 2024 RAMPAGE Interactive
// Written by vq9o

import { execSync } from 'child_process';
import { Command } from 'commander';
import figlet from "figlet";
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import open from 'open';
import express from 'express';
import config from 'config';

//import packageJson from '../package.json' assert { type: 'json' };
import { version as kpm_current_version } from './version';
import { installLocation, setInstallLocation, setUnsafe, unsafeMode } from './config.js';

import {
    downloadPackage,
    getPackageManifest,
    uninstallPackage,
    updatePackage,
    outputPackageManifest,
    checkPackageUpdate
} from "./util.js";

export function getInstalledPackages() {
    const libraryPath = path.join(process.cwd(), installLocation);

    if (!fs.existsSync(libraryPath)) {
        console.log('No packages installed.');
        return [];
    }

    const packages = fs.readdirSync(libraryPath).filter((dir) =>
        fs.statSync(path.join(libraryPath, dir)).isDirectory()
    );

    return packages;
}

async function checkAllPackageUpdates() {
    const packages = getInstalledPackages();

    for (const packageName of packages) {
        await checkPackageUpdate(packageName);
    }
}

console.log(figlet.textSync("KPM client"));
console.log("Copyright (c) 2024 RAMPAGE Interactive.");
console.log("Written by vq9o and Contributor(s).");

const program = new Command();

program
    .version(kpm_current_version)
    .description('Knight Package Manager CLI')


program
    .command('install <package> [version]')
    .description('Install a package.')
    .action((pkg, version = 'latest') => {
        downloadPackage(pkg, version).then(() => getPackageManifest(pkg, version));
    });

program
    .command('uninstall <package>')
    .description('Uninstall a package.')
    .action((pkg) => {
        console.log(`Uninstalling package ${pkg}...`);
        uninstallPackage(pkg);
    });

program
    .command('update [package]')
    .description('Update all or a specific package.')
    .action((pkg) => {
        updatePackage(pkg || undefined);
    });

program
    .command('output-manifest <package>')
    .description('Output the manifest of a package.')
    .action((pkg) => {
        outputPackageManifest(pkg);
    });

program
    .command('check-update <package>')
    .description('Check if a new version of a package is available.')
    .action((pkg) => {
        checkPackageUpdate(pkg);
    });

program
    .command('publish')
    .description('Open the KPM publish form in your default browser.')
    .action(() => {
        const url = 'https://kpm.metatable.dev/publish';
        console.log(chalk.blue(`Opening the KPM publish form at ${url}...`));
        open(url).catch((error) => {
            console.error(chalk.red(`Failed to open URL: ${error.message}`));
        });
    });

program.command('count')
    .description('Get the count of installed packages.')
    .action(() => {
        const packageCount = getInstalledPackages().length;
        console.log(chalk.green(`Number of installed packages: ${packageCount}`));
    });

program.command('set-path <path>')
    .description('Set the installation location for packages.')
    .action((path) => {
        try {
            setInstallLocation(path);
            console.log(chalk.green(`Installation location set to ${path}`));
        } catch (error) {
            const err = error as Error;
            console.error(chalk.red(`Failed to set installation location: ${err.message}`));
        }
    });

program.command('check-updates')
    .description('Check all installed packages for updates.')
    .action(async () => {
        console.log(chalk.blue('Checking for updates for all installed packages...'));
        try {
            await checkAllPackageUpdates();
            console.log(chalk.green('Update check complete.'));
        } catch (error) {
            console.error(chalk.red('Failed to check for updates.'), error);
        }
    });

program
    .command('npm')
    .description('Uninstall and reinstall KPM Client to the latest version.').action(() => {
        try {
            console.log(chalk.blue('Uninstalling current version of kpm...'));
            execSync('npm uninstall -g kpm.client', { stdio: 'inherit' });

            console.log(chalk.blue('Installing the latest version of kpm...'));
            execSync('npm install -g kpm.client', { stdio: 'inherit' });

            console.log(chalk.green('KPM has been successfully reinstalled.'));
        } catch (error) {
            console.error(chalk.red('Failed to uninstall or install kpm.'), error);
        }
    });

program.command('get-path')
    .description('Get the current installation location for packages.')
    .action(() => {
        console.log(chalk.green(`Current installation location: ${path.join(process.cwd(), installLocation)}`));
    });

program.command('unsafemode')
    .description('Enable or disable unsafe mode.')
    .action(() => {
        setUnsafe(!unsafeMode);
        console.log(chalk.yellow(`Unsafe mode is now ${unsafeMode ? 'enabled' : 'disabled'}.`));
    });

program
    .command('login')
    .description('Log in to KPM and save the authentication key.')
    .action(() => {
        const app = express();
        const port = 3000;

        app.get('/login_callback', async (req, res) => {
            const authKey = req.query.key;

            if (authKey) {
                config.util.setModuleDefaults('auth', { key: authKey });
                res.send('Login successful! You can close this window.');
                console.log(chalk.green('Login successful! Authentication key saved.'));
            } else {
                res.send('Login failed! No key found.');
                console.log(chalk.red('Login failed! No key found.'));
            }

            server.close();
        });

        const server = app.listen(port, () => {
            const loginUrl = `https://kpm.metatable.dev/api/v1/oauth/external_login`;
            console.log(chalk.blue(`Opening the login page at ${loginUrl}...`));
            open(loginUrl).catch((error) => {
                console.error(chalk.red(`Failed to open URL: ${error.message}`));
            });
        });
    });

program.parse(process.argv);

if (!process.argv.slice(2).length) program.outputHelp();

const options = program.opts();

if (options.install) {
    const [packageName, version = 'latest'] = options.install.split('@');
    downloadPackage(packageName, version).then(() => getPackageManifest(packageName, version));
}

if (options.uninstall) {
    uninstallPackage(options.uninstall);
}

if (options.update) {
    updatePackage(options.update || undefined);
}

if (options.outputManifest) {
    outputPackageManifest(options.outputManifest);
}

if (options.checkUpdate) {
    checkPackageUpdate(options.checkUpdate);
}