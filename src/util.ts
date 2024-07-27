// Copyright (c) 2024 RAMPAGE Interactive
// Written by vq9o

import axios from 'axios';
import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import chalk from "chalk";
import ProgressBar from "progress";

import { domain, installLocation } from "./config.js";

function jsonToLua(jsonData: object): string {
    const luaData = Object.entries(jsonData)
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join(',\n');
    return `return {\n${luaData}\n}`;
}

async function downloadPackage(packageName: string, version: string, packageDir: string) {
    try {
        const url = `${domain}/download/${packageName}@${version}`;
        const response = await axios.get(url, { responseType: 'stream' });

        if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });
        
        const zipPath = path.join(packageDir, `${packageName}-${version}.zip`);
        const writer = fs.createWriteStream(zipPath);
        const totalLength = parseInt(response.headers['content-length'], 10);

        const progressBar = new ProgressBar(`-> downloading [:bar] :percent :etas`, {
            width: 40,
            complete: '=',
            incomplete: ' ',
            renderThrottle: 16,
            total: totalLength,
        });

        response.data.on('data', (chunk: any) => progressBar.tick(chunk.length));
        response.data.pipe(writer);

        return new Promise<void>((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        }).then(() => unzipPackage(zipPath, packageDir));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(chalk.red(`Failed to download package ${packageName}@${version}: ${error.response?.data?.message || error.message}`));
        } else {
            console.error(chalk.red(`Failed to download package ${packageName}@${version}: ${error}`));
        }
    }
}

async function unzipPackage(zipPath: string, packageDir: string) {
    try {
        fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: packageDir }))
            .on('close', () => {
                fs.unlinkSync(zipPath);
                console.log(chalk.green(`Package extracted to ${packageDir}`));
            });
    } catch (error) {
        console.error(chalk.red(`Failed to unzip package: ${error instanceof Error ? error.message : error}`));
    }
}

async function getPackageManifest(packageName: string, version: string, packageDir: string) {
    try {
        const url = `${domain}/manifest/${packageName}@${version}`;
        const response = await axios.get(url);

        if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });
        
        const manifestLua = jsonToLua(response.data);
        fs.writeFileSync(path.join(packageDir, 'manifest.lua'), manifestLua);
        console.log(chalk.green(`Manifest for ${packageName}@${version} written to manifest.lua`));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(chalk.red(`Failed to fetch manifest for package ${packageName}@${version}: ${error.response?.data?.message || error.message}`));
        } else {
            console.error(chalk.red(`Failed to fetch manifest for package ${packageName}@${version}: ${error}`));
        }
    }
}

async function outputPackageManifest(packageName: string) {
    try {
        const manifestPath = path.join(process.cwd(), 'Knight', 'Packages', 'library', packageName, 'manifest.lua');
        if (fs.existsSync(manifestPath)) {
            const manifestData = fs.readFileSync(manifestPath, 'utf-8');
            console.log(chalk.blue(manifestData));
        } else {
            console.log(chalk.yellow(`Manifest for package ${packageName} not found.`));
        }
    } catch (error) {
        console.error(chalk.red(`Failed to output manifest for package ${packageName}: ${error instanceof Error ? error.message : error}`));
    }
}

async function checkPackageUpdate(packageName: string) {
    try {
        const localManifestPath = path.join(process.cwd(), 'Knight', 'Packages', 'library', packageName, 'manifest.lua');
        
        if (!fs.existsSync(localManifestPath)) return console.log(chalk.yellow(`Package ${packageName} is not installed.`));

        const localManifestContent = fs.readFileSync(localManifestPath, 'utf-8');
        const localManifestMatch = localManifestContent.match(/version = "([\d.]+)"/);
        const localVersion = localManifestMatch ? localManifestMatch[1] : null;

        const url = `${domain}/manifest/${packageName}@latest`;
        const response = await axios.get(url);
        const remoteVersion = response.data.version;

        if (localVersion && remoteVersion && localVersion !== remoteVersion) {
            console.log(chalk.green(`A new version of ${packageName} is available: ${remoteVersion} (current: ${localVersion})`));
        } else if (localVersion === remoteVersion) {
            console.log(chalk.blue(`Package ${packageName} is up to date (version: ${localVersion}).`));
        } else {
            console.log(chalk.red(`Could not determine version update status for ${packageName}.`));
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(chalk.red(`Failed to check update for package ${packageName}: ${error.response?.data?.message || error.message}`));
        } else {
            console.error(chalk.red(`Failed to check update for package ${packageName}: ${error}`));
        }
    }
}

async function uninstallPackage(packageName: string) {
    try {
        const packageDir = path.join(process.cwd(), 'Knight', 'Packages', 'library', packageName);

        if (fs.existsSync(packageDir)) {
            fs.rmdirSync(packageDir, { recursive: true });
            console.log(chalk.green(`Package ${packageName} uninstalled successfully.`));
        } else {
            console.log(chalk.yellow(`Package ${packageName} is not installed.`));
        }
    } catch (error) {
        console.error(chalk.red(`Failed to uninstall package ${packageName}: ${error instanceof Error ? error.message : error}`));
    }
}

async function getLatestVersion(packageName: string): Promise<string | null> {
    try {
        const url = `${domain}/latest-version/${packageName}`;
        const response = await axios.get(url);
        return response.data.version || null;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to fetch latest version for ${packageName}: ${error.message}`);
        } else {
            console.error(`Failed to fetch latest version for ${packageName}: Unknown error`);
        }

        return null;
    }
}

function getCurrentVersion(packageDir: string): string {
    try {
        const manifestPath = path.join(packageDir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            return manifest.version || 'unknown';
        }
        return 'unknown';
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to read current version for ${packageDir}: ${error.message}`);
        } else {
            console.error(`Failed to read current version for ${packageDir}: Unknown error`);
        }
        
        return 'unknown';
    }
}

async function updatePackage(packageName?: string) {
    try {
        const baseDir = path.join(process.cwd(), installLocation);

        if (packageName) {
            // Update a specific package
            const packageDir = path.join(baseDir, packageName);
            
            if (!fs.existsSync(packageDir)) {
                console.error(`Package ${packageName} not found.`);
                return;
            }

            // Get the latest version of the package
            const latestVersion = await getLatestVersion(packageName);
            const currentVersion = getCurrentVersion(packageDir);

            if (latestVersion && latestVersion !== currentVersion) {
                console.log(`Updating ${packageName} from version ${currentVersion} to ${latestVersion}...`);
                await downloadPackage(packageName, latestVersion, packageDir);
                console.log(`Package ${packageName} updated successfully.`);
            } else {
                console.log(`Package ${packageName} is already up-to-date.`);
            }
        } else {
            // Update all packages
            const packageDirs = fs.readdirSync(baseDir);

            for (const dir of packageDirs) {
                const packageDir = path.join(baseDir, dir);

                if (fs.statSync(packageDir).isDirectory()) {
                    const latestVersion = await getLatestVersion(dir);
                    const currentVersion = getCurrentVersion(packageDir);

                    if (latestVersion && latestVersion !== currentVersion) {
                        console.log(`Updating ${dir} from version ${currentVersion} to ${latestVersion}...`);
                        await downloadPackage(dir, latestVersion, packageDir);
                        console.log(`Package ${dir} updated successfully.`);
                    } else {
                        console.log(`Package ${dir} is already up-to-date.`);
                    }
                }
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to update package ${packageName}: ${error.message}`);
        } else {
            console.error(`Failed to update package ${packageName}: Unknown error`);
        }
    }
}

export {
    downloadPackage,
    getPackageManifest,
    uninstallPackage,
    updatePackage,
    outputPackageManifest,
    checkPackageUpdate,
    getLatestVersion,
    getCurrentVersion
};
