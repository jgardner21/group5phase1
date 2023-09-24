const {exec, ExecException } = require('child_process');

const command = `npm install`;

exec(command, (error, stdout, stderr) => {
if (error) {
    console.error(`Error installing dependencies:`, error);
} else {
    // Count dependencies before filtering
    const dependencyCount = (stdout.match(/added \d+ package/g) || []).length;

    const lines = stdout.split('\n');
    const filteredLines = lines.filter(line => {
    return !(
        line.includes("up to date, audited") ||
        line.includes("packages are looking for funding") ||
        line.includes("found 0 vulnerabilities") ||
        line.trim() === "run `npm fund` for details"
    );
    });

    // Display dependency count and filtered output
    console.log(`${dependencyCount} dependencies installed...`);
    console.log(`${filteredLines.join('\n').trim()}`);
}
if (stderr) {
    console.error(stderr);
}
});
