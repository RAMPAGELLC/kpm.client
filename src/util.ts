import axios, { AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { installLocation, API_DOMAIN } from './config.js';
import chalk from 'chalk';
import ProgressBar from 'progress';

// Convert JSON data to a Lua table
export function jsonToLua(jsonData: object): string {
    const luaData = Object.entries(jsonData)
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join(',\n');
    return `return {\n${luaData}\n}`;
}

export async function downloadPackage(packageName: string, version: string) {
    try {
        let manifestKey = "1.0.0";

        if (version != "latest") {
            const manifestResponse = await axios.get(`${API_DOMAIN}/packages/release/${packageName}/${version}`);
            manifestKey = manifestResponse.data.data.manifestKey;
        } else {
            const manifestResponse = await axios.get(`${API_DOMAIN}/packages/releases/${packageName}`);
            manifestKey = manifestResponse.data.package.latestManifestKey;
        }

        const url = `${API_DOMAIN}/packages/download/${manifestKey}`;
        const response = await axios.get(url, { responseType: 'stream' });
        const totalLength = response.headers['content-length'];

        const packageDir = path.join(process.cwd(), installLocation, packageName);
        if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });

        const zipPath = path.join(packageDir, `${packageName}-${version}.zip`);
        const writer = fs.createWriteStream(zipPath);

        const progressBar = new ProgressBar('-> downloading [:bar] :percent :etas', {
            width: 40,
            complete: '=',
            incomplete: ' ',
            renderThrottle: 1,
            total: parseInt(totalLength)
        });

        response.data.on('data', (chunk: Buffer) => progressBar.tick(chunk.length));
        response.data.pipe(writer);

        return new Promise<void>((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        }).then(() => unzipPackage(zipPath, packageDir));
    } catch (error) {
        const err = error as Error;
        console.error(chalk.red(`Failed to download package ${packageName}@${version}: ${err.message}`));
    }
}

export async function unzipPackage(zipPath: string, packageDir: string) {
    try {
        const zipStream = fs.createReadStream(zipPath);
        const unzipStream = unzipper.Extract({ path: packageDir });

        const progressBar = new ProgressBar('-> extracting [:bar] :percent :etas', {
            width: 40,
            complete: '=',
            incomplete: ' ',
            renderThrottle: 1,
            total: fs.statSync(zipPath).size
        });

        zipStream.on('data', (chunk: Buffer) => progressBar.tick(chunk.length));

        return new Promise<void>((resolve, reject) => {
            zipStream.pipe(unzipStream)
                .on('close', () => {
                    fs.unlinkSync(zipPath);
                    console.log(chalk.green(`Package extracted to ${packageDir}`));
                    resolve();
                })
                .on('error', reject);
        });
    } catch (error) {
        const err = error as Error;
        console.error(chalk.red(`Failed to unzip package: ${err.message}`));
    }
}

export async function getPackageManifest(packageName: string, version: string) {
    try {
        const response = await axios.get(`${API_DOMAIN}/packages/release/${packageName}/${version}`);
        const manifest = response.data.data.manifest;
        const manifestDir = path.join(process.cwd(), installLocation, packageName);

        if (!fs.existsSync(manifestDir)) fs.mkdirSync(manifestDir, { recursive: true });

        const manifestLua = jsonToLua(response.data);
        fs.writeFileSync(path.join(manifestDir, 'manifest.lua'), manifestLua);

        console.log(chalk.green(`Manifest for ${packageName}@${version} written to manifest.lua`));
    } catch (error) {
        const err = error as Error;
        console.error(chalk.red(`Failed to fetch manifest for package ${packageName}@${version}: ${err.message}`));
    }
}

export function getCurrentVersion(packageDir: string): string {
    try {
        const manifestPath = path.join(packageDir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            return manifest.version || 'unknown';
        }
        return 'unknown';
    } catch (error) {
        console.error(chalk.red(`Failed to read current version for ${packageDir}: ${error instanceof Error ? error.message : 'Unknown error'}`));
        return 'unknown';
    }
}

export async function getLatestVersion(packageName: string): Promise<string | null> {
    try {
        const response = await axios.get(`${API_DOMAIN}/packages/releases/${packageName}`);
        return response.data.versions[0].version;
    } catch (error) {
        const err = error as Error;
        console.error(chalk.red(`Failed to fetch latest version for ${packageName}: ${err.message}`));
        return null;
    }
}

export async function checkPackageUpdate(packageName: string) {
    try {
        const currentVersion = getCurrentVersion(path.join(process.cwd(), installLocation, packageName));
        const latestVersion = await getLatestVersion(packageName);

        if (latestVersion !== null && currentVersion !== latestVersion) {
            console.log(chalk.yellow(`Package ${packageName} has a new version available: ${latestVersion}. Current version: ${currentVersion}`));
        } else {
            console.log(chalk.green(`Package ${packageName} is up-to-date.`));
        }
    } catch (error) {
        const err = error as Error;
        console.error(chalk.red(`Failed to check update for ${packageName}.`), err);
    }
}

export function getInstalledPackages(): string[] {
    const packagesDir = path.join(process.cwd(), installLocation);
    if (!fs.existsSync(packagesDir)) {
        return [];
    }
    return fs.readdirSync(packagesDir).filter(file => fs.statSync(path.join(packagesDir, file)).isDirectory());
}

export async function checkAllPackageUpdates() {
    const packages = getInstalledPackages();
    for (const packageName of packages) {
        await checkPackageUpdate(packageName);
    }
}

export async function updatePackage(packageName?: string) {
    const packages = packageName ? [packageName] : getInstalledPackages();

    for (const pkg of packages) {
        try {
            const currentVersion = getCurrentVersion(path.join(process.cwd(), installLocation, pkg));
            const latestVersion = await getLatestVersion(pkg);

            if (latestVersion !== null && currentVersion !== latestVersion) {
                console.log(chalk.yellow(`Updating ${pkg} from ${currentVersion} to ${latestVersion}...`));
                await downloadPackage(pkg, latestVersion);
                await getPackageManifest(pkg, latestVersion);
                console.log(chalk.green(`Updated ${pkg} to version ${latestVersion}.`));
            } else {
                console.log(chalk.green(`${pkg} is already up-to-date.`));
            }
        } catch (error) {
            const err = error as Error;
            console.error(chalk.red(`Failed to update package ${pkg}: ${err.message}`));
        }
    }
}

export function uninstallPackage(packageName: string): void {
    console.log(`Uninstalling package ${packageName}...`);

    const packageDir = path.join(process.cwd(), installLocation, packageName);

    if (fs.existsSync(packageDir)) {
        fs.rmSync(packageDir, { recursive: true, force: true });
        console.log(chalk.green(`Package ${packageName} has been successfully uninstalled.`));
    } else {
        console.log(chalk.red(`Package ${packageName} does not exist.`));
    }
}

export function outputPackageManifest(packageName: string): void {
    const packageDir = path.join(process.cwd(), installLocation, packageName);
    const manifestPath = path.join(packageDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        const manifest = fs.readFileSync(manifestPath, 'utf8');
        console.log(chalk.green(`Manifest for ${packageName}:`));
        console.log(manifest);
    } else {
        console.log(chalk.red(`Manifest for ${packageName} does not exist.`));
    }
}