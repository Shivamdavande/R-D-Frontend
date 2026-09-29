const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 transparent PNG base64
const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSU56GgoAAAANSU56GgoAAAANSU56GgoAAAANSU56Ggo=',
  'base64'
);

const files = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];

files.forEach((file) => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, pngBuffer);
    console.log(`Created asset: ${file}`);
  }
});
