class MinimalReporter {
    constructor(globalConfig, options) {
      this._globalConfig = globalConfig;
      this._options = options;
    }
  
    onRunComplete(contexts, results) {
      const numTotalTests = results.numTotalTests;
      const numPassedTests = results.numPassedTests;
  
      let coverage = 'N/A'; // Default coverage value
  

  
      console.log(`Total: ${numTotalTests}`);
      console.log(`Passed: ${numPassedTests}`);
      console.log(`${numPassedTests}/${numTotalTests} test cases passed.`);
    }
  }
  
  module.exports = MinimalReporter;
  