# Chat messages → Google Sheet + your email

About 5 minutes. You only do this once.

## 1. Create the sheet
1. Go to <https://sheets.google.com> and create a **Blank spreadsheet**.
2. Name it **Presto Website Leads**.

## 2. Add the script
1. In the sheet, open **Extensions → Apps Script**.
2. Delete the sample code, then paste in everything from `Code.gs` (in this folder).
3. Check the `OWNER_EMAIL` line at the top is the address you want messages sent to.
4. Click the **Save** (disk) icon.

## 3. Authorize it (one time)
1. In the function dropdown at the top, choose **authorizeAndTest** and click **Run**.
2. Google will ask for permission. Choose your account → **Advanced** → **Go to (project) (unsafe)** → **Allow**.
   This warning appears for every personal script. You wrote and own this one.
3. When it finishes you should have a **Leads** tab with one test row, and a test email in your inbox.

## 4. Publish it as a web app
1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy** and **copy the Web app URL** (it ends in `/exec`).

## 5. Connect it to the website
1. Open `js/chat-config.js` in the site files.
2. Paste the URL between the quotes on the `endpoint:` line, like this:
   `endpoint: "https://script.google.com/macros/s/XXXXXXXX/exec",`
3. Upload the changed file to `public_html/js/` (or redeploy from Git).
4. Open the site, click **Chat with us**, and send yourself a test message.
   You should get an email, and a new row in the **Leads** sheet.

## Notes
- **Replying:** the email's Reply button goes to the visitor, not to yourself.
- **If you edit the script later:** use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. The URL stays the same.
- **No endpoint set?** The chat still works. At the last step it gives the visitor a ready-made "Email your message" link instead.
- **Daily limits:** a free Google account can send roughly 100 emails a day through scripts, which is plenty for chat messages.
- **Privacy:** the sheet holds visitors' names, emails and phone numbers. Keep it private (don't share the link), and only use the details to answer their message.
