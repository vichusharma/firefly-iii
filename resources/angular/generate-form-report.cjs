const fs = require('fs');
const path = require('path');

// Read the generated JSON report
const reportPath = path.join(__dirname, 'playwright-artifacts', 'form-alignment-report.json');
const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Generate enhanced report with visual comparisons
const enhancedReport = {
  generatedAt: new Date().toISOString(),
  reportVersion: '1.0',
  summary: {
    formsAnalyzed: 3,
    totalFields: 0,
    totalIssues: 0,
    overallHealthScore: 0,
  },
  formComparison: {
    accountForm: null,
    transactionForm: null,
    budgetForm: null,
  },
  alignmentAnalysis: {
    fieldWidths: {},
    labelPositioning: {},
    buttonConsistency: {},
  },
  visualComparison: [],
  detailedFindings: [],
  recommendations: [],
};

// Process each form
Object.entries(reportData.forms).forEach(([formKey, formMetrics]) => {
  if (!formMetrics) return;

  enhancedReport.summary.totalFields += formMetrics.fields.length;
  enhancedReport.summary.totalIssues += formMetrics.issues.length;

  const formAnalysis = {
    name: formMetrics.formName,
    fieldCount: formMetrics.fields.length,
    buttonCount: formMetrics.buttons.length,
    dialogSize: `${formMetrics.dialogDimensions?.width}px × ${formMetrics.dialogDimensions?.height}px`,
    issues: formMetrics.issues.length,
    issueDetails: formMetrics.issues,
  };

  // Analyze field metrics
  if (formMetrics.fields.length > 0) {
    const widths = formMetrics.fields.map((f) => f.width).filter((w) => w > 0);
    const heights = formMetrics.fields.map((f) => f.fieldContainerDimensions.height);
    const xPositions = formMetrics.fields.map((f) => f.fieldContainerDimensions.x);

    formAnalysis.fieldMetrics = {
      widthStats: {
        min: Math.min(...widths),
        max: Math.max(...widths),
        average: Math.round(widths.reduce((a, b) => a + b) / widths.length),
        variance: Math.max(...widths) - Math.min(...widths),
      },
      heightStats: {
        min: Math.min(...heights),
        max: Math.max(...heights),
        average: Math.round(heights.reduce((a, b) => a + b) / heights.length),
      },
      alignmentStats: {
        xVariance: Math.max(...xPositions) - Math.min(...xPositions),
        isAligned: Math.max(...xPositions) - Math.min(...xPositions) <= 5,
      },
    };

    // Detail fields
    formAnalysis.fieldDetails = formMetrics.fields.map((field) => ({
      name: field.label,
      type: field.type,
      dimensions: `${field.width}px × ${field.fieldContainerDimensions.height}px`,
      positioning: {
        x: field.fieldContainerDimensions.x,
        y: field.fieldContainerDimensions.y,
      },
      labelAlignment: field.labelAlignment,
      required: field.isRequired,
      issues: [],
    }));
  }

  // Analyze button metrics
  if (formMetrics.buttons.length > 0) {
    const buttonHeights = formMetrics.buttons.map((b) => b.height);
    const buttonXs = formMetrics.buttons.map((b) => b.x);

    formAnalysis.buttonMetrics = {
      count: formMetrics.buttons.length,
      heightVariance: Math.max(...buttonHeights) - Math.min(...buttonHeights),
      xVariance: Math.max(...buttonXs) - Math.min(...buttonXs),
      buttons: formMetrics.buttons.map((btn) => ({
        label: btn.label,
        size: `${btn.width}px × ${btn.height}px`,
        position: `x: ${btn.x}px`,
        disabled: btn.disabled,
      })),
    };
  }

  enhancedReport.formComparison[formKey] = formAnalysis;
});

// Generate visual comparison ASCII art
enhancedReport.visualComparison = generateVisualComparison(reportData.forms);

// Generate detailed findings
Object.entries(reportData.forms).forEach(([formKey, formMetrics]) => {
  if (!formMetrics || !formMetrics.issues.length) return;

  const finding = {
    form: formMetrics.formName,
    severity: calculateSeverity(formMetrics.issues.length),
    issueCount: formMetrics.issues.length,
    issues: formMetrics.issues.map((issue) => ({
      type: categorizeIssue(issue),
      description: issue,
      impact: determineImpact(issue),
    })),
  };

  enhancedReport.detailedFindings.push(finding);
});

// Generate recommendations
enhancedReport.recommendations = generateRecommendations(enhancedReport.detailedFindings);

// Calculate health score
enhancedReport.summary.overallHealthScore = calculateHealthScore(
  enhancedReport.summary.totalFields,
  enhancedReport.summary.totalIssues
);

// Helper functions
function generateVisualComparison(forms) {
  const comparisons = [];

  Object.entries(forms).forEach(([formKey, metrics]) => {
    if (!metrics || !metrics.fields.length) return;

    const fieldWidths = metrics.fields
      .map((f) => f.width)
      .sort((a, b) => b - a);
    const maxWidth = Math.max(...fieldWidths);
    const minWidth = Math.min(...fieldWidths);

    const visualization = `
${metrics.formName} - Field Width Distribution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Min Width: ${minWidth}px | Max Width: ${maxWidth}px | Variance: ${maxWidth - minWidth}px

Field Width Bars (normalized to 30 chars):
${metrics.fields
  .map((field, idx) => {
    const barLength = Math.round((field.width / maxWidth) * 30);
    const bar = '█'.repeat(barLength);
    return `${String(idx + 1).padEnd(2)} ${field.label.padEnd(30)} │${bar} ${field.width}px`;
  })
  .join('\n')}

Label Alignment:
${metrics.fields
  .map((field) => `  ${field.label}: ${field.labelAlignment}`)
  .join('\n')}
`;

    comparisons.push(visualization);
  });

  return comparisons.join('\n\n');
}

function calculateSeverity(issueCount) {
  if (issueCount === 0) return 'None';
  if (issueCount <= 3) return 'Low';
  if (issueCount <= 6) return 'Medium';
  return 'High';
}

function categorizeIssue(issue) {
  if (issue.includes('width')) return 'Width';
  if (issue.includes('alignment') || issue.includes('aligned')) return 'Alignment';
  if (issue.includes('spacing') || issue.includes('gap') || issue.includes('whitespace')) return 'Spacing';
  if (issue.includes('height')) return 'Height';
  if (issue.includes('Button')) return 'Button';
  if (issue.includes('label')) return 'Label';
  return 'Other';
}

function determineImpact(issue) {
  if (issue.includes('not') || issue.includes('inconsistent')) return 'High';
  if (issue.includes('narrow') || issue.includes('short')) return 'Medium';
  return 'Low';
}

function generateRecommendations(findings) {
  const recommendations = [];

  if (findings.some((f) => f.issues.some((i) => i.type === 'Width'))) {
    recommendations.push({
      priority: 'High',
      category: 'Field Widths',
      suggestion: 'Ensure all input fields have consistent widths across forms',
      action: 'Use flex-layout or CSS grid to enforce uniform field sizing',
      expectedOutcome: 'Field width variance should be less than 10px',
    });
  }

  if (findings.some((f) => f.issues.some((i) => i.type === 'Alignment'))) {
    recommendations.push({
      priority: 'High',
      category: 'Field Alignment',
      suggestion: 'Verify left/right alignment of all form fields',
      action: 'Use CSS classes or Material layout modules to align fields to a grid',
      expectedOutcome: 'All fields should have X position variance less than 5px',
    });
  }

  if (findings.some((f) => f.issues.some((i) => i.type === 'Label'))) {
    recommendations.push({
      priority: 'Medium',
      category: 'Label Positioning',
      suggestion: 'Standardize label positioning relative to inputs',
      action: 'Use consistent label placement (above, beside, or floating)',
      expectedOutcome: 'All labels should use the same alignment strategy',
    });
  }

  if (findings.some((f) => f.issues.some((i) => i.type === 'Button'))) {
    recommendations.push({
      priority: 'Medium',
      category: 'Button Layout',
      suggestion: 'Improve button alignment and consistency',
      action: 'Use flexbox to align buttons and ensure uniform heights',
      expectedOutcome: 'Buttons should have height variance less than 5px and aligned X positions',
    });
  }

  if (findings.some((f) => f.issues.some((i) => i.type === 'Spacing'))) {
    recommendations.push({
      priority: 'Low',
      category: 'Spacing',
      suggestion: 'Improve vertical and horizontal spacing consistency',
      action: 'Apply Material Design spacing guidelines (multiples of 8px)',
      expectedOutcome: 'Spacing variance should be standardized',
    });
  }

  return recommendations;
}

function calculateHealthScore(totalFields, totalIssues) {
  if (totalFields === 0) return 0;
  const issueRatio = totalIssues / totalFields;
  const score = Math.max(0, 100 - issueRatio * 20);
  return Math.round(score);
}

// Save enhanced report
const enhancedReportPath = path.join(__dirname, 'playwright-artifacts', 'form-alignment-report-enhanced.json');
fs.writeFileSync(enhancedReportPath, JSON.stringify(enhancedReport, null, 2));

// Generate text summary
const textSummary = `
╔════════════════════════════════════════════════════════════════════════════╗
║                    FORM ALIGNMENT VISUAL COMPARISON REPORT                 ║
╚════════════════════════════════════════════════════════════════════════════╝

Generated: ${new Date().toISOString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Health Score: ${enhancedReport.summary.overallHealthScore}/100

Forms Analyzed: ${enhancedReport.summary.formsAnalyzed}
Total Fields: ${enhancedReport.summary.totalFields}
Total Issues Found: ${enhancedReport.summary.totalIssues}

${enhancedReport.visualComparison}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETAILED FORM ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.entries(enhancedReport.formComparison)
  .map(([key, form]) => {
    if (!form) return '';
    return `
${form.name}
├─ Fields: ${form.fieldCount}
├─ Buttons: ${form.buttonCount}
├─ Dialog Size: ${form.dialogSize}
├─ Issues: ${form.issues}
${
  form.fieldMetrics
    ? `└─ Field Metrics:
   ├─ Width Range: ${form.fieldMetrics.widthStats.min}px - ${form.fieldMetrics.widthStats.max}px (avg: ${form.fieldMetrics.widthStats.average}px)
   ├─ Height Range: ${form.fieldMetrics.heightStats.min}px - ${form.fieldMetrics.heightStats.max}px (avg: ${form.fieldMetrics.heightStats.average}px)
   └─ Alignment: ${form.fieldMetrics.alignmentStats.isAligned ? '✓ Aligned' : '✗ Not Aligned'} (X variance: ${form.fieldMetrics.alignmentStats.xVariance}px)`
    : ''
}
`;
  })
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUES BY SEVERITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${enhancedReport.detailedFindings
  .map((finding) => {
    const severityEmoji = {
      None: '✓',
      Low: '⚠',
      Medium: '⚡',
      High: '❌',
    }[finding.severity];

    return `
${severityEmoji} ${finding.form} [${finding.severity} Severity] - ${finding.issueCount} issues

${finding.issues
  .map((issue) => `   • [${issue.type}] ${issue.description} (Impact: ${issue.impact})`)
  .join('\n')}
`;
  })
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDATIONS FOR IMPROVEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${enhancedReport.recommendations
  .map((rec, idx) => {
    const priorityEmoji = {
      High: '🔴',
      Medium: '🟡',
      Low: '🟢',
    }[rec.priority];

    return `
${idx + 1}. ${priorityEmoji} ${rec.category} (Priority: ${rec.priority})
   
   Issue: ${rec.suggestion}
   
   Action: ${rec.action}
   
   Expected Outcome: ${rec.expectedOutcome}
`;
  })
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIELD-BY-FIELD COMPARISON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.entries(enhancedReport.formComparison)
  .map(([key, form]) => {
    if (!form || !form.fieldDetails) return '';
    return `
${form.name}
──────────────────────────────────────────────

${form.fieldDetails
  .map((field, idx) => {
    return `${idx + 1}. ${field.name}
   ├─ Type: ${field.type}
   ├─ Size: ${field.dimensions}
   ├─ Position: X=${field.positioning.x}px, Y=${field.positioning.y}px
   ├─ Label: ${field.labelAlignment}
   └─ Required: ${field.required ? 'Yes' : 'No'}`;
  })
  .join('\n\n')}
`;
  })
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report generated: ${new Date().toLocaleString()}
`;

const textReportPath = path.join(__dirname, 'playwright-artifacts', 'form-alignment-report.txt');
fs.writeFileSync(textReportPath, textSummary);

console.log('✅ Enhanced reports generated:');
console.log(`   📊 JSON Report: ${path.relative(process.cwd(), enhancedReportPath)}`);
console.log(`   📄 Text Report: ${path.relative(process.cwd(), textReportPath)}`);
console.log('\n' + textSummary);
