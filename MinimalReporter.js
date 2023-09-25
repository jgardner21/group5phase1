class MinimalReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  // Add an event listener for onRunComplete
  onRunComplete(contexts, results) {
    // Access the coverage data
    const coverageMap = global.__coverage__ || null; // Use global.__coverage__ to access the coverage data

    const numTotalTests = results.numTotalTests;
    const numPassedTests = results.numPassedTests;

    let coverage = 'N/A'; // Default coverage value

    if (coverageMap) {
      const coverageSummary = global.__coverage__._coverageSummary; // Access coverage summary
      if (coverageSummary && coverageSummary.lines) {
        coverage = `${coverageSummary.lines.pct}%`;
      }
    }

    console.log(`Total: ${numTotalTests}`);
    console.log(`Passed: ${numPassedTests}`);
    console.log(`Coverage: ${coverage}`);
    console.log(`${numPassedTests}/${numTotalTests} test cases passed. ${coverage} line coverage achieved.`);
  }
}

module.exports = MinimalReporter;
