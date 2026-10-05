const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 helper for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPNG(size, isForegroundOnly = false) {
  const raw = Buffer.alloc(size * (size * 4 + 1));

  // Helper to blend pixel at normalized coordinates (nx, ny in [0..1])
  function getPixel(nx, ny) {
    // Distance from center for rounded squircle badge
    const cx = nx - 0.5;
    const cy = ny - 0.5;

    let r = 15, g = 23, b = 42, a = 255;

    if (isForegroundOnly) {
      // Transparent background for Android Adaptive Icon foreground (safe zone is center 66%)
      // Remap nx, ny so the artwork sits nicely inside the adaptive icon safe circle
      nx = (nx - 0.5) * 1.42 + 0.5;
      ny = (ny - 0.5) * 1.42 + 0.5;
      a = 0;
    } else {
      // Rich dark slate/indigo gradient background with subtle arcade grid
      const grad = Math.min(1, Math.max(0, (nx + ny) * 0.5));
      r = Math.round(12 + grad * 14);
      g = Math.round(18 + grad * 28);
      b = Math.round(38 + grad * 45);

      // Subtle radial glow behind cats
      const distCenter = Math.hypot(cx, cy);
      if (distCenter < 0.42) {
        const glow = (1 - distCenter / 0.42) * 0.35;
        r = Math.min(255, Math.round(r + 16 * glow));
        g = Math.min(255, Math.round(g + 185 * glow));
        b = Math.min(255, Math.round(b + 129 * glow));
      }

      // Subtle arcade grid lines
      const gx = Math.abs(((nx * 12) % 1) - 0.5);
      const gy = Math.abs(((ny * 12) % 1) - 0.5);
      if (gx < 0.03 || gy < 0.03) {
        r = Math.min(255, r + 8);
        g = Math.min(255, g + 12);
        b = Math.min(255, b + 18);
      }

      // Outer golden-emerald arcade border
      const maxEdge = Math.max(Math.abs(cx), Math.abs(cy));
      if (maxEdge > 0.44 && maxEdge < 0.475) {
        r = 16; g = 185; b = 129;
      }
    }

    function setCol(cr, cg, cb, ca = 255) {
      r = cr; g = cg; b = cb; a = ca;
    }

    // Helper: rounded rectangle check
    function inRoundRect(x, y, rx, ry, rw, rh, rad) {
      if (x < rx || x > rx + rw || y < ry || y > ry + rh) return false;
      const qx = Math.max(rx + rad, Math.min(rx + rw - rad, x));
      const qy = Math.max(ry + rad, Math.min(ry + rh - rad, y));
      return Math.hypot(x - qx, y - qy) <= rad;
    }

    // Helper: triangle check (for cute cat ears!)
    function inTriangle(px, py, x1, y1, x2, y2, x3, y3) {
      const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
      const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
      const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
      const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      return !(hasNeg && hasPos);
    }

    // Helper to draw a cute blocky Pico Friends cat!
    function drawCat(catX, catY, catW, catH, bodyRGB, darkRGB, blushRGB, lookDir = 1) {
      const earW = catW * 0.28;
      const earH = catH * 0.28;

      // Left & Right pointy cat ears (with dark outline)
      const inLeftEarOuter = inTriangle(
        nx, ny,
        catX + 0.01, catY + 0.02,
        catX + earW + 0.02, catY + 0.02,
        catX + 0.03, catY - earH
      );
      const inRightEarOuter = inTriangle(
        nx, ny,
        catX + catW - earW - 0.02, catY + 0.02,
        catX + catW - 0.01, catY + 0.02,
        catX + catW - 0.03, catY - earH
      );

      // Dark outline around body & ears
      const pad = 0.016;
      const inBodyOutline = inRoundRect(nx, ny, catX - pad, catY - pad, catW + pad * 2, catH + pad * 2, 0.045);
      if (inBodyOutline || inLeftEarOuter || inRightEarOuter) {
        setCol(15, 23, 42, 255);
      }

      // Inner ears
      const inLeftEar = inTriangle(
        nx, ny,
        catX + 0.025, catY + 0.02,
        catX + earW, catY + 0.02,
        catX + 0.04, catY - earH + 0.022
      );
      const inRightEar = inTriangle(
        nx, ny,
        catX + catW - earW, catY + 0.02,
        catX + catW - 0.025, catY + 0.02,
        catX + catW - 0.04, catY - earH + 0.022
      );

      // Main cat body
      const inBody = inRoundRect(nx, ny, catX, catY, catW, catH, 0.035);
      if (inBody || inLeftEar || inRightEar) {
        // Bottom shadow stripe on body
        if (ny > catY + catH * 0.78) {
          setCol(darkRGB[0], darkRGB[1], darkRGB[2], 255);
        } else {
          setCol(bodyRGB[0], bodyRGB[1], bodyRGB[2], 255);
        }
        // Top highlight on head
        if (ny > catY + 0.012 && ny < catY + 0.032 && nx > catX + 0.04 && nx < catX + catW - 0.04) {
          setCol(
            Math.min(255, bodyRGB[0] + 45),
            Math.min(255, bodyRGB[1] + 45),
            Math.min(255, bodyRGB[2] + 45),
            255
          );
        }
      }

      // Cute eyes
      const eyeOffsetX = lookDir * 0.012;
      const leftEyeX = catX + catW * 0.33 + eyeOffsetX;
      const rightEyeX = catX + catW * 0.67 + eyeOffsetX;
      const eyeY = catY + catH * 0.44;
      const eyeR = catW * 0.115;

      const dLeftEye = Math.hypot(nx - leftEyeX, ny - eyeY);
      const dRightEye = Math.hypot(nx - rightEyeX, ny - eyeY);

      if (dLeftEye <= eyeR || dRightEye <= eyeR) {
        setCol(255, 255, 255, 255);
        // Dark pupil
        const pupilShiftX = lookDir * eyeR * 0.22;
        const dLeftPupil = Math.hypot(nx - (leftEyeX + pupilShiftX), ny - eyeY);
        const dRightPupil = Math.hypot(nx - (rightEyeX + pupilShiftX), ny - eyeY);
        if (dLeftPupil <= eyeR * 0.58 || dRightPupil <= eyeR * 0.58) {
          setCol(15, 23, 42, 255);
        }
        // Kawaii white eye shine
        const dLeftShine = Math.hypot(nx - (leftEyeX - eyeR * 0.2), ny - (eyeY - eyeR * 0.25));
        const dRightShine = Math.hypot(nx - (rightEyeX - eyeR * 0.2), ny - (eyeY - eyeR * 0.25));
        if (dLeftShine <= eyeR * 0.24 || dRightShine <= eyeR * 0.24) {
          setCol(255, 255, 255, 255);
        }
      }

      // Cute blush cheeks
      const leftBlush = Math.hypot((nx - (catX + catW * 0.18)) * 0.8, (ny - (eyeY + catH * 0.16)) * 1.4);
      const rightBlush = Math.hypot((nx - (catX + catW * 0.82)) * 0.8, (ny - (eyeY + catH * 0.16)) * 1.4);
      if ((leftBlush < 0.022 || rightBlush < 0.022) && inBody) {
        setCol(blushRGB[0], blushRGB[1], blushRGB[2], 255);
      }

      // Cute little cat mouth ('w')
      const mx = nx - (catX + catW * 0.5 + eyeOffsetX);
      const my = ny - (eyeY + catH * 0.17);
      if (Math.abs(mx) < 0.028 && Math.abs(my - Math.abs(mx * 0.6)) < 0.008) {
        setCol(15, 23, 42, 255);
      }
    }

    // Platform floor at the bottom
    if (inRoundRect(nx, ny, 0.14, 0.81, 0.72, 0.075, 0.025)) {
      setCol(51, 65, 85, 255);
      if (ny < 0.83) setCol(16, 185, 129, 255); // Emerald grass top
    }

    // Draw 3 Stacked Pico Friends Cats!
    // 1. Bottom Cat (Emerald Green - Player 1)
    drawCat(0.31, 0.59, 0.38, 0.22, [16, 185, 129], [5, 150, 105], [251, 113, 133], 1);

    // 2. Middle Cat (Amber Orange - Player 2)
    drawCat(0.33, 0.37, 0.34, 0.21, [245, 158, 11], [217, 119, 6], [251, 113, 133], -1);

    // 3. Top Cat (Sky Blue - Player 3)
    drawCat(0.35, 0.17, 0.30, 0.19, [56, 189, 248], [2, 132, 199], [244, 114, 182], 1);

    // Golden Key icon floating on the right side!
    const kx = 0.78, ky = 0.28;
    const dKeyRingOuter = Math.hypot(nx - kx, ny - ky);
    if (dKeyRingOuter <= 0.075) {
      setCol(15, 23, 42, 255);
    }
    if (dKeyRingOuter <= 0.06 && dKeyRingOuter >= 0.024) {
      setCol(250, 204, 21, 255); // Gold ring
    }
    // Key shaft & teeth pointing down
    if (inRoundRect(nx, ny, kx - 0.016, ky + 0.05, 0.032, 0.13, 0.01)) {
      setCol(250, 204, 21, 255);
    }
    if (inRoundRect(nx, ny, kx + 0.01, ky + 0.11, 0.035, 0.022, 0.006) ||
        inRoundRect(nx, ny, kx + 0.01, ky + 0.15, 0.042, 0.022, 0.006)) {
      setCol(250, 204, 21, 255);
    }

    return [r, g, b, a];
  }

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter type 0
    const ny = (y + 0.5) / size;
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size;
      const [r, g, b, a] = getPixel(nx, ny);
      const idx = rowStart + 1 + x * 4;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// 1. Update public/ PWA icons
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, false));
console.log('[Pico Friends Icons] Imagens PWA atualizadas em public/!');

// 2. If android/ folder exists, automatically update all Android Studio mipmap launcher icons!
const androidResDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
if (fs.existsSync(androidResDir)) {
  const mipmaps = [
    { folder: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { folder: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { folder: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { folder: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { folder: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const m of mipmaps) {
    const dir = path.join(androidResDir, m.folder);
    if (fs.existsSync(dir)) {
      const iconBuf = createPNG(m.size, false);
      const fgBuf = createPNG(m.fgSize, true);
      fs.writeFileSync(path.join(dir, 'ic_launcher.png'), iconBuf);
      fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), iconBuf);
      fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fgBuf);
    }
  }

  // Update adaptive icon background color to match Pico Friends dark slate
  const bgXmlPath = path.join(androidResDir, 'values', 'ic_launcher_background.xml');
  if (fs.existsSync(bgXmlPath)) {
    fs.writeFileSync(
      bgXmlPath,
      '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0F172A</color>\n</resources>\n'
    );
  }

  // 3. Configure styles.xml for Fullscreen + Edge-to-Edge Cutout support
  const stylesXmlPath = path.join(androidResDir, 'values', 'styles.xml');
  if (fs.existsSync(stylesXmlPath)) {
    let stylesContent = fs.readFileSync(stylesXmlPath, 'utf8');
    if (!stylesContent.includes('android:windowFullscreen')) {
      stylesContent = stylesContent.replace(
        '<item name="windowNoTitle">true</item>',
        '<item name="windowNoTitle">true</item>\n        <item name="android:windowFullscreen">true</item>\n        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>'
      );
      fs.writeFileSync(stylesXmlPath, stylesContent);
    }
  }

  // 4. Configure MainActivity.java for True Immersive Fullscreen (hides status bar: battery, time, wifi + hides nav bar)
  const mainActivityPath = path.join(
    process.cwd(),
    'android',
    'app',
    'src',
    'main',
    'java',
    'com',
    'picofriends',
    'game',
    'MainActivity.java'
  );
  if (fs.existsSync(mainActivityPath)) {
    const immersiveMainActivity = `package com.picofriends.game;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enableImmersiveFullscreen();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveFullscreen();
        }
    }

    private void enableImmersiveFullscreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View decorView = getWindow().getDecorView();
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), decorView);
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
    }
}
`;
    fs.writeFileSync(mainActivityPath, immersiveMainActivity);
    console.log('[Pico Friends Android] MainActivity.java configurado em Modo Tela Cheia Imersivo (sem barra de bateria/hora/botões)!');
  }

  // 5. Ensure AndroidManifest.xml has sensorLandscape and usesCleartextTraffic="true" (for local Wi-Fi & online servers)
  const manifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    if (!manifest.includes('android:usesCleartextTraffic')) {
      manifest = manifest.replace('<application', '<application\n        android:usesCleartextTraffic="true"');
    }
    if (!manifest.includes('android:screenOrientation')) {
      manifest = manifest.replace(
        'android:name=".MainActivity"',
        'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"'
      );
    }
    fs.writeFileSync(manifestPath, manifest);
  }

  console.log('[Pico Friends Icons] Ícones nativos do Android Studio (mipmap-*) atualizados com sucesso!');
}
