const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'src', 'app', 'api');
const apiBackupDir = path.join(rootDir, 'src', 'app', '_api_temp_backup');
const nextDir = path.join(rootDir, '.next');
const outDir = path.join(rootDir, 'out');
const resourcesDir = path.join(rootDir, 'resources');
const neuJsSrc = path.join(rootDir, 'node_modules', '@neutralinojs', 'lib', 'dist', 'neutralino.js');

console.log('📦 Starting AI-Benchy Standalone Binary Build...');

try {
  // 1. Clean previous build artifacts
  console.log('🧹 Cleaning .next, out, and resources cache...');
  if (fs.existsSync(nextDir)) fs.rmSync(nextDir, { recursive: true, force: true });
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  if (fs.existsSync(resourcesDir)) fs.rmSync(resourcesDir, { recursive: true, force: true });

  // 2. Temporarily backup API routes for static HTML export
  let apiBackedUp = false;
  if (fs.existsSync(apiDir)) {
    console.log('➡️  Staging API routes for static compilation...');
    fs.renameSync(apiDir, apiBackupDir);
    apiBackedUp = true;
  }

  try {
    // 3. Build Next.js Static Export
    console.log('⚡ Building Next.js static assets into /out ...');
    execSync('npx next build', {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env, STATIC_EXPORT: 'true' },
    });
  } finally {
    // Always restore API directory
    if (apiBackedUp && fs.existsSync(apiBackupDir)) {
      console.log('↩️  Restoring API routes...');
      fs.renameSync(apiBackupDir, apiDir);
    }
  }

  // 4. Copy /out to /resources (Neutralino's native documentRoot)
  console.log('📁 Copying static assets from /out to /resources ...');
  fs.cpSync(outDir, resourcesDir, { recursive: true });

  // 5. Inject Neutralino client library into /resources
  if (fs.existsSync(neuJsSrc)) {
    console.log('🔌 Copying Neutralino.js client SDK into /resources...');
    fs.copyFileSync(neuJsSrc, path.join(resourcesDir, 'neutralino.js'));
  }

  // 6. Run Neutralino build
  console.log('🔨 Compiling standalone native desktop binaries with Neutralinojs...');
  execSync('npx @neutralinojs/neu build --release', {
    cwd: rootDir,
    stdio: 'inherit',
  });

  console.log('\n🎉 Standalone Desktop Binaries Built Successfully!\n');
  const distDir = path.join(rootDir, 'dist', 'ai-benchy');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    console.log('Generated Native Binaries in dist/ai-benchy:');
    files.forEach((file) => {
      const stats = fs.statSync(path.join(distDir, file));
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`  • ${file} (${sizeMb} MB)`);
    });
  }
} catch (error) {
  console.error('\n❌ Binary Build Failed:', error.message);
  if (fs.existsSync(apiBackupDir)) {
    fs.renameSync(apiBackupDir, apiDir);
  }
  process.exit(1);
}
