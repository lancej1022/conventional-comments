const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Function to copy a file
function copyFile(source, target) {
    const targetDir = path.dirname(target);
    ensureDirectoryExists(targetDir);
    fs.copyFileSync(source, target);
}

// Function to bundle JS files using esbuild to resolve imports
async function bundleScript(entryPoint, outFile, shouldMinify) {
    try {
        await esbuild.build({
            entryPoints: [entryPoint],
            bundle: true,
            outfile: outFile,
            minify: shouldMinify,
        });
    } catch (error) {
        console.error(`Error bundling ${entryPoint}:`, error);
        process.exit(1);
    }
}

// Function to build Chrome extension
async function buildChrome(buildMode) {
    const chromeDir = path.join(__dirname, 'build', 'chrome');
    ensureDirectoryExists(chromeDir);
    
    // Create Chrome manifest
    const baseManifest = JSON.parse(fs.readFileSync('./manifest-base.json', 'utf8'));
    const chromeManifest = {
        ...baseManifest,
        background: {
            service_worker: 'background.js',
            type: 'module',
        },
    }

    fs.writeFileSync(
        path.join(chromeDir, 'manifest.json'),
        JSON.stringify(chromeManifest, null, 2)
    );

    // Bundle JavaScript files (to account for imports)
    await bundleScript('./src/content.js', path.join(chromeDir, 'content.js'), buildMode == 'prod');
    copyFile('./src/background.js', path.join(chromeDir, 'background.js'));
    copyFile('./src/style.css', path.join(chromeDir, 'style.css'));

    // Copy assets
    const assetsDir = path.join(chromeDir, 'assets');
    ensureDirectoryExists(assetsDir);
    copyFile('./assets/slack_icon.svg', path.join(assetsDir, 'slack_icon.svg'));
    
    // Copy icons
    const iconsDir = path.join(chromeDir, 'icons');
    ensureDirectoryExists(iconsDir);
    copyFile('./icons/icon16.png', path.join(iconsDir, 'icon16.png'));
    copyFile('./icons/icon48.png', path.join(iconsDir, 'icon48.png'));
    copyFile('./icons/icon128.png', path.join(iconsDir, 'icon128.png'));

    console.log('Chrome build completed successfully!');
}

// Function to build Firefox extension
async function buildFirefox(buildMode) {
    const firefoxDir = path.join(__dirname, 'build', 'firefox');
    ensureDirectoryExists(firefoxDir);
    
    // Create Firefox manifest
    const baseManifest = JSON.parse(fs.readFileSync('./manifest-base.json', 'utf8'));
    const firefoxManifest = {
        ...baseManifest,
        background: {
            scripts: ['background.js'],
        },
        browser_specific_settings: {
            gecko: {
                id: "conventional-comments-addon@pullpo.io"
            }
        }
    };
    
    fs.writeFileSync(
        path.join(firefoxDir, 'manifest.json'),
        JSON.stringify(firefoxManifest, null, 2)
    );

    // Bundle JavaScript files (to account for imports)
    await bundleScript('./src/content.js', path.join(firefoxDir, 'content.js'), buildMode == 'prod');
    copyFile('./src/background.js', path.join(firefoxDir, 'background.js'));
    copyFile('./src/style.css', path.join(firefoxDir, 'style.css'));

    // Copy assets
    const assetsDir = path.join(firefoxDir, 'assets');
    ensureDirectoryExists(assetsDir);
    copyFile('./assets/slack_icon.svg', path.join(assetsDir, 'slack_icon.svg'));
    
    // Copy icons
    const iconsDir = path.join(firefoxDir, 'icons');
    ensureDirectoryExists(iconsDir);
    copyFile('./icons/icon16.png', path.join(iconsDir, 'icon16.png'));
    copyFile('./icons/icon48.png', path.join(iconsDir, 'icon48.png'));
    copyFile('./icons/icon128.png', path.join(iconsDir, 'icon128.png'));

    console.log('Firefox build completed successfully!');
}

// Get the build type from command line arguments
(async () => {
    let buildTypes = ['chrome', 'firefox'];
    let buildMode = 'dev';

    const processArg = (arg) => {
        switch(arg) {
            case 'chrome':
            case 'firefox':
                return buildTypes = [arg];
            case 'prod':
            case 'dev':
                return buildMode = arg;
        }
    };

    for (let arg of process.argv.slice(2)) {
        processArg(arg);
    }

    for (let build of buildTypes) {
        if (build == 'chrome') {
            buildChrome(buildMode);
        } else if (build == 'firefox') {
            buildFirefox(buildMode);
        }
    }
})();