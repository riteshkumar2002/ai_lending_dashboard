const fs = require('fs');
const path = require('path');

const root = __dirname;
const srcDir = path.join(root, 'src', 'components');
const destDir = path.join(root, 'public', 'src', 'components');

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(srcDir)) {
  console.error(`Source directory not found: ${srcDir}`);
  process.exit(1);
}

fs.rmSync(path.join(root, 'public', 'src'), { recursive: true, force: true });
copyRecursive(srcDir, destDir);
console.log(`Copied ${srcDir} -> ${destDir}`);
