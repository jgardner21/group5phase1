const { spawnSync } = require('child_process');

export default function begin_tests() {
  const jestResult = spawnSync('npx', ['jest', /*'--reporters=<rootDir>/MinimalReporter.js',*/ '--coverage'], { stdio: 'inherit' });

  if (jestResult.error) {
    process.exit(1);
  }

  if (jestResult.status !== 0) {
    process.exit(1);
  }
}
