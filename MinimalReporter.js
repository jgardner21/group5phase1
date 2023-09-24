class MinimalReporter {
    constructor(globalConfig, options) {
      this._globalConfig = globalConfig;
      this._options = options;
    }
  
    onRunComplete(contexts, results) {
      const numTotalTests = results.numTotalTests;
      const numPassedTests = results.numPassedTests;
  
      let coverage = 'N/A'; // Default coverage value
  
      if (results.coverageMap) {
        const coverageSummary = results.coverageMap.getCoverageSummary();
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
  