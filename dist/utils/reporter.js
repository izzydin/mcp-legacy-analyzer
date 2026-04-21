export class Reporter {
    /**
     * Generates a peer-review style Code Health Report from diagnostics.
     */
    static generateHealthReport(diagnostics) {
        if (diagnostics.length === 0) {
            return "🎉 Code Health Report\n===================\nLooks solid! No legacy patterns or performance bottlenecks detected. Great job!";
        }
        let report = "🧐 Senior Dev Peer-Review: Code Health Report\n=============================================\n\n";
        diagnostics.forEach(diag => {
            const severityIcon = diag.severity === 'error' ? '❌' : (diag.severity === 'warning' ? '⚠️' : '💡');
            report += "[" + severityIcon + " Line " + diag.line + "]: [" + diag.severity.toUpperCase() + "] [" + diag.ruleId + "]\n";
            report += "   Issue:  " + diag.message + "\n";
            if (diag.action) {
                report += "   Action: " + diag.action + "\n";
            }
            report += '\n';
        });
        report += "Keep up the great work! Let's get this codebase ready for React 18+.";
        return report;
    }
}
