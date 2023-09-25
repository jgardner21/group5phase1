const { spawnSync } = require('child_process');
const fs = require('fs');

export default function begin_tests() {
  const jestResult = spawnSync('npx', ['jest', '--config jest.config.js', '--reporters=<rootDir>/MinimalReporter.js', '--coverage'], { stdio: 'pipe' });
  console.log(jestResult.stdout.toString());

  if (jestResult.error) {
    process.exit(1);
  }

  if (jestResult.status !== 0) {
    process.exit(1);
  }
  console.log(jestResult.stdout.toString());
  
  // Capture Jest output
  const jestOutput = jestResult.stdout.toString();

  // Extract coverage summary
  const coverageSummary = jestOutput.match(/Lines\s+:\s+(\d+\.\d+)\%/);
  const coveragePercentage = coverageSummary ? coverageSummary[1] : 'N/A';

  // Modify Jest output to include coverage percentage
  const modifiedJestOutput = jestOutput.replace('N/A', `${coveragePercentage}%`);

  console.log(modifiedJestOutput);

}
