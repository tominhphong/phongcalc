# Lead Capture Modal Setup Guide

## Overview
The `lead-capture.ts` utility provides a modal form to collect lead data (name, email, phone) before users download reports or print results. It integrates with HubSpot Forms API.

## Files Created/Modified

1. **Created:** `/src/utils/lead-capture.ts` (356 lines)
   - Main utility file with TypeScript types and functions
   - Handles modal rendering, validation, HubSpot integration

2. **Modified:** `/src/style.css` (appended 245 lines of CSS)
   - All `.lc-*` classes for modal styling
   - Responsive design for mobile and desktop
   - Dark theme matching PhongCalc design system

## Setup Instructions

### Step 1: Get HubSpot Credentials

You need TWO pieces of information from your HubSpot account:

1. **Portal ID:**
   - Go to HubSpot Settings > Account > Portal ID
   - Copy the numeric ID (e.g., `123456789`)

2. **Form GUID:**
   - Go to HubSpot Forms > Create a new form OR edit existing form
   - In the form preview, look for the GUID in the embed code
   - Or visit: https://app.hubspot.com/forms/YOUR_PORTAL_ID/forms
   - Copy the form GUID (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Step 2: Update Configuration

Edit `/src/utils/lead-capture.ts` and fill in the constants at the top:

```typescript
const HUBSPOT_PORTAL_ID = '123456789'; // YOUR PORTAL ID HERE
const HUBSPOT_FORM_GUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // YOUR FORM GUID HERE
```

### Step 3: Use in Your Code

Import and call the function when user clicks "Download PDF" or "Print":

```typescript
import { showLeadCapture } from './utils/lead-capture';

// When user clicks download button:
function handleDownloadPDF() {
  showLeadCapture('Tải báo cáo PDF', () => {
    // This callback runs after user submits or skips
    // Now perform the actual download
    downloadPDF();
  });
}

// When user clicks print button:
function handlePrint() {
  showLeadCapture('In báo cáo', () => {
    // Perform print action
    window.print();
  });
}
```

## How It Works

### First Time User
1. User clicks "Download PDF" or "Print"
2. Modal appears asking for: Name, Email, Phone (optional)
3. User fills form and clicks "Nhận báo cáo ngay" (Get Report Now)
4. Data is sent to HubSpot (if credentials configured)
5. Modal closes, callback executes (downloads/prints)
6. Session storage marked so modal won't show again in this session

### Returning User (Same Session)
1. User clicks "Download PDF" or "Print" again
2. Modal is skipped (sessionStorage checked)
3. Callback executes immediately (downloads/prints)

### User Clicks "Bỏ qua" (Skip)
- Modal closes without collecting data
- Callback still executes (downloads/prints)
- Session marked to skip modal for rest of session

## Modal Features

### Fields
- **Name** (required): Full name of user
- **Email** (required): Valid email address
- **Phone** (optional): Contact number
- **Calculator** (hidden): Auto-filled from page title

### Validation
- Name: Cannot be empty
- Email: Must be valid email format (basic regex)
- Shows inline error messages in Vietnamese/English

### Language Support
- Bilingual: Vietnamese default, English hidden until language toggle
- Follows PhongCalc's language system (`.vi-text` / `.en-text`)

### HubSpot Integration
Submits these fields to HubSpot:
- `firstname`: Extracted from name
- `lastname`: Extracted from name
- `email`: User's email
- `phone`: User's phone (if provided)
- `calculator_used`: Page title
- `action_name`: Action description (e.g., "Tải báo cáo PDF")

**Note:** If HubSpot credentials are not configured, modal still works but data is only stored in session.

## Error Handling

### Graceful Degradation
- If HubSpot API fails → still marks as submitted, closes modal, executes callback
- No network errors break the UX
- Console warnings logged for debugging

### Validation Errors
- Shows red error message below invalid field
- User can correct and resubmit
- Errors clear when user starts typing

## Session Behavior

### SessionStorage Key
- Key: `phongcalc_lead_submitted`
- Value: `"true"` (set after first submission)
- Cleared when user closes browser/tab

### Use Cases
- **Download CSV**: User can download, then if they click Print → no modal again
- **Multiple actions**: Any action (Download/Print/etc) marks session, all subsequent actions skip modal
- **New session**: User closes tab/returns later → modal shows again

## Styling

### Colors
- Submit button: `#0054a6` (professional blue realtor color)
- Error text: `var(--danger)` (#f87171)
- Modal uses dark theme (matches PhongCalc design)
- Backdrop blur for modern effect

### Responsive
- Desktop: Modal width up to 420px
- Mobile: Modal scales to fit screen with 20px padding
- Touch-friendly input sizes (44px minimum height)

### Animation
- Smooth fade-in when modal appears
- Scale/translate for depth effect
- All transitions use CSS `var(--transition)` (0.25s ease)

## Troubleshooting

### Modal Doesn't Show
1. Check `HUBSPOT_PORTAL_ID` and `HUBSPOT_FORM_GUID` are strings (even if empty)
2. Check that `showLeadCapture()` is being called with correct parameters
3. Open browser console (F12) for any errors

### Data Not Reaching HubSpot
1. Verify Portal ID and Form GUID are correct in lead-capture.ts
2. Check HubSpot form accepts these field names: firstname, lastname, email, phone
3. Check browser network tab (F12 > Network) for POST to api.hsforms.com
4. Verify form is "Active" in HubSpot

### Modal Styling Looks Wrong
1. Ensure style.css has 1063+ lines (new CSS appended)
2. Check CSS variables are defined in `:root` section
3. Verify no CSS conflicts from calculator styles

### User Sees Same Modal Again
- This is expected if using incognito/private mode or new browser session
- SessionStorage is cleared on browser close
- Use `sessionStorage.clear()` in console to reset for testing

## Testing

### Manual Test Flow
```javascript
// In browser console:
import { showLeadCapture } from './utils/lead-capture.ts';

// Test 1: Show modal first time
showLeadCapture('Test Download', () => {
  console.log('Callback executed!');
});

// (Fill form, submit, modal closes and callback runs)

// Test 2: Click another action → modal should NOT show
showLeadCapture('Test Print', () => {
  console.log('Second action callback!');
});

// Test 3: Clear session and try again
sessionStorage.clear();
showLeadCapture('Test Again', () => {
  console.log('Modal shows again after session clear');
});
```

### Testing Without HubSpot
Leave `HUBSPOT_PORTAL_ID` and `HUBSPOT_FORM_GUID` empty (they already are). Modal will:
- Still show
- Still collect data
- Still validate and close
- Just won't send to HubSpot
- Perfect for testing UI/UX

## Production Checklist

- [ ] Portal ID filled in lead-capture.ts
- [ ] Form GUID filled in lead-capture.ts
- [ ] HubSpot form is Active (not Draft)
- [ ] HubSpot form is Public or has correct permissions
- [ ] Tested form submission in browser
- [ ] Tested with empty fields (validation works)
- [ ] Tested that sessionStorage prevents re-showing
- [ ] Tested "Skip" button closes modal
- [ ] Tested "X" close button works
- [ ] Mobile view looks good (tested on phone/emulator)

## Support

For issues or questions:
- Check HubSpot form credentials match
- Look at browser console for errors
- Check network tab for failed API calls
- Review validation error messages on form fields
