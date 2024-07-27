// Copyright (c) 2024 RAMPAGE Interactive
// Written by vq9o

import axios from 'axios';
import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import chalk from "chalk";
import ProgressBar from "progress";

import { domain } from "./config";

export function jsonToLua(jsonData: object): string {
    const luaData = Object.entries(jsonData)
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join(',\n');
    return `return {\n${luaData}\n}`;
}

export async function downloadPackage(packageName: string, version: string) {
    try {
        const url = `${domain}/download/${packageName}@${version}`;
        const response = await axios.get(url, { responseType: 'stream' });
        const packageDir = path.join(process.cwd(), 'Knight', 'Packages', 'library', packageName);

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

export async function unzipPackage(zipPath: string, packageDir: string) {
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

export async function getPackageManifest(packageName: string, version: string) {
    try {
        const url = `${domain}/manifest/${packageName}@${version}`;
        const response = await axios.get(url);
        const manifestDir = path.join(process.cwd(), 'Knight', 'Packages', 'library', packageName);
        if (!fs.existsSync(manifestDir)) {
            fs.mkdirSync(manifestDir, { recursive: true });
        }
        const manifestLua = jsonToLua(response.data);
        fs.writeFileSync(path.join(manifestDir, 'manifest.lua'), manifestLua);
        console.log(chalk.green(`Manifest for ${packageName}@${version} written to manifest.lua`));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(chalk.red(`Failed to fetch manifest for package ${packageName}@${version}: ${error.response?.data?.message || error.message}`));
        } else {
            console.error(chalk.red(`Failed to fetch manifest for package ${packageName}@${version}: ${error}`));
        }
    }
}

export async function outputPackageManifest(packageName: string) {
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

export async function checkPackageUpdate(packageName: string) {
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

export async function uninstallPackage(packageName: string) {
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

export async function updatePackage(packageName?: string) {
    if (packageName) {
        console.log(chalk.blue(`Updating package ${packageName}...`));
        await downloadPackage(packageName, 'latest');
        await getPackageManifest(packageName, 'latest');
    } else {
        console.log(chalk.blue(`Updating all packages...`));
        const packagesDir = path.join(process.cwd(), 'Knight', 'Packages', 'library');
        const packageNames = fs.readdirSync(packagesDir).filter(name => fs.lstatSync(path.join(packagesDir, name)).isDirectory());

        for (const name of packageNames) {
            await downloadPackage(name, 'latest');
            await getPackageManifest(name, 'latest');
        }
    }
}