const fs = require('fs');
const path = require('path');

const targetTypesDir = path.join(__dirname, '../../target/types');
const sdkSrcTypesDir = path.join(__dirname, '../src/types');

const targetIdlDir = path.join(__dirname, '../../target/idl');
const sdkSrcIdlDir = path.join(__dirname, '../src/idl');

if (!fs.existsSync(sdkSrcIdlDir)) {
    fs.mkdirSync(sdkSrcIdlDir, { recursive: true });
}

const filesToCopy = [
    { name: 'sss_core.ts', source: targetTypesDir, dest: sdkSrcTypesDir },
    { name: 'sss_transfer_hook.ts', source: targetTypesDir, dest: sdkSrcTypesDir },
    { name: 'sss_core.json', source: targetIdlDir, dest: sdkSrcIdlDir },
    { name: 'sss_transfer_hook.json', source: targetIdlDir, dest: sdkSrcIdlDir }
];

console.log('Fetching updated IDLs from target...');

filesToCopy.forEach(file => {
    const sourcePath = path.join(file.source, file.name);
    const destPath = path.join(file.dest, file.name);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file.name}`);
    } else {
        console.error(`❌ Source file not found: ${sourcePath}`);
    }
});

console.log('Done fetching updated IDLs!');
