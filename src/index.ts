// Copyright (c) 2024 RAMPAGE Interactive
// Written by vq9o

import figlet from "figlet";
import commander from "commander";

import {
    downloadPackage,
    getPackageManifest,
    uninstallPackage,
    updatePackage,
    outputPackageManifest,
    checkPackageUpdate
} from "./util";

console.log(figlet.textSync("KPM client"));
console.log("Copyright (c) 2024 RAMPAGE Interactive.");
console.log("Written by vq9o and Contributor(s).");

const program = new commander.Command();
program
    .version("1.0.0")
    .description("Knight Package Manager CLI")
    .option("-i, --install <package> <version?>", "Install a package.")
    .option("-u, --uninstall <package>", "Uninstall a package.")
    .option("-up, --update <package?>", "Update all or a specific package.")
    .option("-o, --output-manifest <package>", "Output the manifest of a package.")
    .option("-c, --check-update <package>", "Check if a new version of a package is available.")
    .parse(process.argv);

const options = program.opts();

if (options.install) {
    const [packageName, version = 'latest'] = options.install.split('@');
    downloadPackage(packageName, version).then(() => getPackageManifest(packageName, version));
} else if (options.uninstall) {
    const packageName = options.uninstall;
    console.log(`Uninstalling package ${packageName}...`);
    uninstallPackage(packageName);
} else if (options.update) {
    const packageName = options.update || undefined;
    updatePackage(packageName);
} else if (options.outputManifest) {
    const packageName = options.outputManifest;
    outputPackageManifest(packageName);
} else if (options.checkUpdate) {
    const packageName = options.checkUpdate;
    checkPackageUpdate(packageName);
}