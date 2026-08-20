/* ============================================================
   REVOLVYN — Contact Form Google Apps Script
   ============================================================
   
   SETUP INSTRUCTIONS:
   
   1. Go to https://script.google.com and create a new project
   
   2. Replace all code in Code.gs with this file
   
   3. Create a Google Sheet and copy its ID from the URL:
      https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit
      Paste the SHEET_ID below in CONFIG
   
   4. In the Google Sheet, create these column headers in Row 1:
      A1: Timestamp
      B1: Name
      C1: Email
      D1: Phone
      E1: Service
      F1: Message
      G1: Status
   
   5. Click "Deploy" > "New deployment"
      - Select type: Web app
      - Execute as: Me
      - Who has access: Anyone
      - Click "Deploy"
      - Copy the Web App URL
   
   6. Paste the Web App URL in contact.html:
      const GOOGLE_APPS_SCRIPT_URL = 'PASTE_URL_HERE';
   
   7. To update NOTIFICATION_EMAIL, change it below and redeploy
   
   ============================================================ */

// ===== CONFIG =====
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
const NOTIFICATION_EMAIL = 'CLIENT_EMAIL_HERE';
const AGENCY_NAME = 'REVOLVYN';
// ==================

function doPost(e) {
  try {
    // Parse incoming data
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'No data received' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Validate required fields
    const name = sanitize(String(data.name || '').trim());
    const email = sanitize(String(data.email || '').trim());
    const phone = sanitize(String(data.phone || '').trim());
    const service = sanitize(String(data.service || '').trim());
    const message = sanitize(String(data.message || '').trim());

    if (!name || !email || !phone || !service) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Missing required fields' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Invalid email format' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getActiveSheet();

    // Append row
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    sheet.appendRow([timestamp, name, email, phone, service, message, 'New']);

    // Send email notification
    if (NOTIFICATION_EMAIL && NOTIFICATION_EMAIL !== 'CLIENT_EMAIL_HERE') {
      sendNotification(name, email, phone, service, message, timestamp);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'Lead saved successfully' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'Server error: ' + err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', service: 'REVOLVYN Contact Form' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function sendNotification(name, email, phone, service, message, timestamp) {
  const subject = 'New Contact Enquiry — ' + AGENCY_NAME;

  const body = [
    'New Contact Enquiry',
    '',
    'Name: ' + name,
    'Email: ' + email,
    'Phone: ' + phone,
    'Service: ' + service,
    '',
    'Message:',
    message || 'N/A',
    '',
    'Submitted: ' + timestamp
  ].join('\n');

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    body: body,
    replyTo: email
  });
}

function sanitize(input) {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
