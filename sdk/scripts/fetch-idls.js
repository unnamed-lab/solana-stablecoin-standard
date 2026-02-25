const fs = require('fs');
const path = require('path');

const targetTypesDir = path.join(__dirname, '../../target/types');
const sdkSrcDir = path.join(__dirname, '../src');

const filesToCopy = [
    'sss_core.ts',
    'sss_transfer_hook.ts'
];

console.log('Fetching updated IDLs from target...');

filesToCopy.forEach(file => {
    const sourcePath = path.join(targetTypesDir, file);
    const destPath = path.join(sdkSrcDir, file);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file}`);
    } else {
        console.error(`❌ Source file not found: ${sourcePath}`);
    }
});

console.log('Done fetching updated IDLs!');
