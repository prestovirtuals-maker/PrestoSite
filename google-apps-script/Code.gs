/**
 * Presto Virtuals: website chat intake
 * Receives messages from the website chat, saves each one as a row in this Google Sheet,
 * and emails it to you. Paste this whole file into Extensions > Apps Script (see SETUP.md).
 */
const OWNER_EMAIL = 'prestovirtuals@gmail.com';   // where new messages are emailed
const SHEET_NAME = 'Leads';                        // tab that is created automatically
const HEADERS = ['Received', 'Name', 'Email', 'Phone', 'Question / message', 'Page', 'Status'];

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const d = JSON.parse(raw);

    const name = clean_(d.name, 100);
    const email = clean_(d.email, 200);
    const phone = clean_(d.phone, 40);
    const message = clean_(d.message, 2000);
    const page = clean_(d.page, 200);

    if (d.website) return json_({ ok: true });                              // honeypot: ignore bots
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json_({ ok: false, error: 'Missing or invalid fields' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet_();
      sheet.appendRow([new Date(), safeCell_(name), safeCell_(email), safeCell_(phone), safeCell_(message), safeCell_(page), 'New']);
    } finally {
      lock.releaseLock();
    }

    MailApp.sendEmail({
      to: OWNER_EMAIL,
      replyTo: email,                                                       // just hit Reply to answer the visitor
      subject: 'New website message from ' + name.replace(/[\r\n]+/g, ' '),
      body: 'You have a new message from your website chat.\n\n' +
            'Name: ' + name + '\n' +
            'Email: ' + email + '\n' +
            'Phone: ' + (phone || '(not given)') + '\n' +
            'Page: ' + (page || '') + '\n\n' +
            'Question / message:\n' + message + '\n\n' +
            '(Logged in your "' + SHEET_NAME + '" sheet.)'
    });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return ContentService.createTextOutput('Presto chat endpoint is running.');
}

/** Run this once from the editor (Run > authorizeAndTest) to grant permissions and confirm it works. */
function authorizeAndTest() {
  const res = doPost({ postData: { contents: JSON.stringify({
    name: 'Test Visitor', email: OWNER_EMAIL, phone: '', message: 'This is a test message from the setup step.', page: '/test'
  }) } });
  Logger.log(res.getContent());
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#0a1450').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
    sheet.setColumnWidths(1, 1, 140);
    sheet.setColumnWidths(2, 2, 180);
    sheet.setColumnWidth(4, 130);
    sheet.setColumnWidth(5, 420);
    sheet.getRange('E:E').setWrap(true);
  }
  return sheet;
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

/** Stops spreadsheet formulas from running if someone types =, +, - or @ at the start. */
function safeCell_(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
