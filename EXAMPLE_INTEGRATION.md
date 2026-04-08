# Integration Example: How to Use Lead Capture in Your Calculators

## Quick Example

Here's how to integrate lead capture modal into a calculator with Download PDF and Print buttons.

### Before (Old Code)
```typescript
// In your calculator file
function handleDownloadPDF() {
  // Directly download PDF
  generateAndDownloadPDF();
}

function handlePrint() {
  // Directly print
  window.print();
}
```

### After (With Lead Capture)
```typescript
import { showLeadCapture } from '../utils/lead-capture';

function handleDownloadPDF() {
  // Show modal, then download on success
  showLeadCapture('Tải báo cáo PDF', () => {
    generateAndDownloadPDF();
  });
}

function handlePrint() {
  // Show modal, then print on success
  showLeadCapture('In báo cáo', () => {
    window.print();
  });
}
```

## Complete Example: Mortgage Calculator

```typescript
import { showLeadCapture } from '../utils/lead-capture';

export class MortgageCalculator {
  private monthlyPayment: number = 0;
  private totalInterest: number = 0;

  calculatePayment() {
    // ... calculation logic ...
  }

  displayResults() {
    // ... show results in UI ...
  }

  // Handle Download CSV
  private handleDownloadCSV() {
    showLeadCapture('Tải file CSV', () => {
      this.downloadAsCSV();
    });
  }

  // Handle Download PDF
  private handleDownloadPDF() {
    showLeadCapture('Tải báo cáo PDF', () => {
      this.generatePDF();
    });
  }

  // Handle Print
  private handlePrint() {
    showLeadCapture('In báo cáo', () => {
      window.print();
    });
  }

  // Actual download implementation
  private downloadAsCSV() {
    const data = `Mortgage Calculation Report
Date,${new Date().toLocaleDateString()}
Loan Amount,$${this.homePrice.toLocaleString()}
Interest Rate,${this.interestRate}%
Loan Term,${this.loanTerm} years
Monthly Payment,$${this.monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 2 })}
Total Interest,$${this.totalInterest.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mortgage-calculation.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private generatePDF() {
    // PDF generation logic
    // This could use a library like jsPDF or html2pdf
  }

  // HTML event listeners (in setupEventListeners method)
  setupEventListeners() {
    const downloadCSVBtn = document.getElementById('download-csv-btn');
    const downloadPDFBtn = document.getElementById('download-pdf-btn');
    const printBtn = document.getElementById('print-btn');

    downloadCSVBtn?.addEventListener('click', () => this.handleDownloadCSV());
    downloadPDFBtn?.addEventListener('click', () => this.handleDownloadPDF());
    printBtn?.addEventListener('click', () => this.handlePrint());
  }
}
```

## Using Different Action Names

The first parameter to `showLeadCapture()` is the action name. Use Vietnamese for consistency:

```typescript
// For CSV download
showLeadCapture('Tải file CSV', callback);

// For PDF download
showLeadCapture('Tải báo cáo PDF', callback);

// For print
showLeadCapture('In báo cáo', callback);

// For Excel export
showLeadCapture('Xuất file Excel', callback);

// For email report
showLeadCapture('Gửi báo cáo qua email', callback);

// For any other action
showLeadCapture('Thực hiện hành động', callback);
```

## HTML Button Examples

In your calculator template:

```html
<div class="calc-actions">
  <button id="download-csv-btn" class="cta-btn cta-text">
    📥 <span class="vi-text">Tải CSV</span>
    <span class="en-text">Download CSV</span>
  </button>

  <button id="download-pdf-btn" class="cta-btn cta-text">
    📄 <span class="vi-text">Tải PDF</span>
    <span class="en-text">Download PDF</span>
  </button>

  <button id="print-btn" class="cta-btn cta-text">
    🖨️ <span class="vi-text">In báo cáo</span>
    <span class="en-text">Print Report</span>
  </button>
</div>
```

## Common Patterns

### Pattern 1: Download with Direct File Generation
```typescript
function handleDownloadData() {
  showLeadCapture('Tải dữ liệu', () => {
    const csvContent = generateCSVContent();
    downloadFile(csvContent, 'data.csv');
  });
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Pattern 2: Email Report (Post to Backend)
```typescript
async function handleEmailReport() {
  showLeadCapture('Gửi báo cáo qua email', async () => {
    const reportData = generateReportData();
    // The lead data was already captured and sent to HubSpot
    // Now send report to backend
    const response = await fetch('/api/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (response.ok) {
      showNotification('✅ Báo cáo đã được gửi!');
    }
  });
}
```

### Pattern 3: Print with Page Setup
```typescript
function handlePrintWithSetup() {
  showLeadCapture('In báo cáo', () => {
    // Scroll to top to show all content
    window.scrollTo(0, 0);
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      window.print();
    }, 100);
  });
}
```

## Testing Your Integration

### Test 1: First Visit
1. Load calculator
2. Click any Download/Print button
3. Modal should appear
4. Fill form and submit
5. Action should execute (download/print)
6. Modal should close

### Test 2: Same Session
1. Click another Download/Print button
2. Modal should NOT appear (sessionStorage prevents it)
3. Action should execute immediately
4. Callback should work correctly

### Test 3: Skip Button
1. Load calculator in new tab (fresh session)
2. Click Download/Print
3. Modal appears
4. Click "Bỏ qua" (Skip)
5. Modal closes
6. Action executes
7. Verify session marked so next action skips modal

### Test 4: Validation
1. Load calculator in incognito/private
2. Click Download/Print
3. Leave Name empty, click "Nhận báo cáo ngay"
4. Error message "Vui lòng nhập họ và tên" appears
5. Type name, error clears
6. Leave Email empty
7. Error message appears
8. Type invalid email (no @)
9. Error appears: "Vui lòng nhập email hợp lệ"
10. Correct email format
11. Error clears, can submit

## TypeScript Types

If you want strict typing, import the types:

```typescript
import { showLeadCapture } from '../utils/lead-capture';

// The function signature (for reference):
function showLeadCapture(
  actionName: string,      // e.g., "Tải báo cáo PDF"
  onSuccess: () => void    // callback function
): void;
```

## Common Issues & Solutions

### Issue: Modal doesn't show
**Solution:**
- Check import path is correct
- Verify `showLeadCapture` is called in button click handler
- Open browser console for error messages

### Issue: Button click does nothing
**Solution:**
- Check HTML button has correct `id`
- Verify event listener is attached: `element?.addEventListener('click', ...)`
- Check no JavaScript errors prevent execution

### Issue: Callback doesn't execute
**Solution:**
- Modal might be stuck if form validation fails
- Check browser console for errors
- Verify callback function is valid

### Issue: Data not going to HubSpot
**Solution:**
- Check Portal ID and Form GUID are set in lead-capture.ts
- Verify HubSpot form is "Active" not "Draft"
- Check network tab for failed POST requests
- Verify form fields match (firstname, lastname, email, phone)

## Performance Notes

- Modal HTML injected once on first use, reused thereafter
- SessionStorage check is instant (< 1ms)
- No external dependencies - pure TypeScript
- CSS animations use GPU acceleration (transform/opacity)
- Works offline if HubSpot submission fails (graceful degradation)

## Accessibility

Modal includes:
- Proper semantic HTML (form, label, input)
- Aria labels for close button
- Focus trap within modal
- Keyboard support (Enter to submit, Esc to close)
- Error messages linked to inputs
- Color contrast meets WCAG AA

## Internationalization

The modal is bilingual:
```html
<span class="vi-text">Vietnamese text</span>
<span class="en-text">English text</span>
```

Which one shows depends on body class:
- Default: shows `.vi-text` (Vietnamese)
- `body.lang-en`: shows `.en-text` (English)

PhongCalc already handles language toggle, so modal auto-switches.

## Production Ready

This integration is production-ready:
- ✅ Handles errors gracefully
- ✅ Validates user input
- ✅ Prevents data loss if HubSpot unavailable
- ✅ Mobile responsive
- ✅ Accessible
- ✅ Bilingual
- ✅ No external dependencies
- ✅ TypeScript with full types
