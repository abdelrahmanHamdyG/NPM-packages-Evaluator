import fs from "fs";

// Read the test-results.json and coverage-summary.json files
const testResults = JSON.parse(fs.readFileSync("cleanTestResults.json", "utf-8"));
const coverageSummary = JSON.parse(fs.readFileSync("coverage/coverage-summary.json", "utf-8"));

// Extract test summary
const totalTests = testResults.numTotalTests;
const passedTests = testResults.numPassedTests;

// Extract coverage summary
const lineCoverage = coverageSummary.total.lines.pct;

// Calculate coverage percentage
const coveragePercentage = lineCoverage.toFixed(2); // Percentage of lines covered

// Output the summary to stdout
console.log(`Total: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Coverage: ${coveragePercentage}%`);
console.log(
  `${passedTests}/${totalTests} test cases passed.${coveragePercentage}% line coverage achieved.`);