const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SOURCE_IMAGE = path.join(PUBLIC_DIR, 'logo.jpg');

// Ensure icons folder exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons from:', SOURCE_IMAGE);
  
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('Error: logo.jpg source image not found at:', SOURCE_IMAGE);
    process.exit(1);
  }

  // Generate standard icons
  for (const size of sizes) {
    const filename = `icon-${size}x${size}.png`;
    const outputPath = path.join(ICONS_DIR, filename);
    await sharp(SOURCE_IMAGE)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${filename}`);
  }

  // Generate apple-touch-icon at 180x180
  const applePath = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
  await sharp(SOURCE_IMAGE)
    .resize(180, 180)
    .png()
    .toFile(applePath);
  console.log('Generated: apple-touch-icon.png in public/');

  // Generate maskable icon at 512x512 with a background or padding
  // Maskable icon must have a safe zone (10% padding). We can pad the image slightly.
  const maskablePath = path.join(ICONS_DIR, 'maskable-512x512.png');
  const size = 512;
  const padding = Math.floor(size * 0.1); // 10% padding
  const innerSize = size - padding * 2;

  const innerImage = await sharp(SOURCE_IMAGE)
    .resize(innerSize, innerSize)
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 251, b: 245, alpha: 1 } // match background color #FFFBF5
    }
  })
  .composite([{ input: innerImage, gravity: 'center' }])
  .png()
  .toFile(maskablePath);

  console.log('Generated: maskable-512x512.png');
  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
