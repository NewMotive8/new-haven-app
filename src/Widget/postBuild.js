import { promises as fsPromises } from 'fs';
import { join, dirname } from 'path';

const versionFilePath = join(process.cwd(), 'version.txt'); // Path to the version file
const filesToCopy = [
    {
        src: join(process.cwd(), './dist/jooba.min.js'),
        dest: join(process.cwd(), './cdn/dist/jooba.min.js')
    },
    {
        src: join(process.cwd(), './dist/jooba.js'),
        dest: join(process.cwd(), './cdn/dist/jooba.js')
    }
];

async function ensureDirectoryExists(filePath) {
    const directory = dirname(filePath);
    await fsPromises.mkdir(directory, { recursive: true });
}

async function addVersionToFile(filePath, version) {
    let content = await fsPromises.readFile(filePath, 'utf8');
    content = `// Version: ${version}\n` + content; // Prepend the version comment
    await fsPromises.writeFile(filePath, content, 'utf8');
}

async function incrementVersion(version) {
    let [major, minor, patch] = version.split('.').map(num => parseInt(num, 10));
    if (patch < 9) {
        patch++;
    } else if (minor < 9) {
        minor++;
        patch = 0;
    } else {
        major++;
        minor = 0;
        patch = 0;
    }
    return `${major}.${minor}.${patch}`;
}

async function postBuild() {
    try {
        let version = await fsPromises.readFile(versionFilePath, 'utf8');
        version = version.trim();
        const newVersion = await incrementVersion(version); // Increment the version

        await fsPromises.writeFile(versionFilePath, newVersion); // Update the version file

        for (const { src, dest } of filesToCopy) {
            await ensureDirectoryExists(dest);

            await fsPromises.copyFile(src, dest);

            await addVersionToFile(dest, newVersion); // Add new version to the file

            console.log(`Successfully copied ${src} to ${dest} with version ${newVersion}`);
        }
    } catch (err) {
        console.error('Error during the process:', err);
        process.exit(1);
    }
}

postBuild();
