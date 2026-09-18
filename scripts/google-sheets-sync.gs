/**
 * ==============================================================================
 * CyberSec Club DIU - Automated Google Sheets Sync Script
 * ==============================================================================
 *
 * HOW TO SET THIS UP (Takes 2 minutes):
 * 1. Open your Google Sheet in Google Drive.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any default code in Code.gs and paste this entire script.
 * 4. Replace `YOUR_SHEETS_SYNC_SECRET` below with the value of `SHEETS_SYNC_SECRET` from your website .env.
 * 5. Click the Save icon (Floppy disk).
 * 6. (Optional) Set Nightly Auto-Sync:
 *    - Click the clock icon on the left ("Triggers").
 *    - Click "+ Add Trigger" (bottom right).
 *    - Select function: "syncCyberClubMembers".
 *    - Select event source: "Time-driven".
 *    - Type of based timer: "Day timer".
 *    - Time of day: "1am to 2am" (or any preferred time).
 *    - Click Save.
 * ==============================================================================
 */

// ── CONFIGURATION ─────────────────────────────────────────────────────────────
const API_URL = "https://cybersecdiu.club/api/export/google-sheets";
const SYNC_SECRET = "YOUR_SHEETS_SYNC_SECRET"; // Match SHEETS_SYNC_SECRET in your .env

/**
 * Adds a custom menu to the Google Sheet toolbar on open.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("CyberSec Club")
    .addItem("🔄 Sync Members Now", "syncCyberClubMembers")
    .addToUi();
}

/**
 * Main function that pulls member & certificate data from the live API.
 */
function syncCyberClubMembers() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName("Members Roster");
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet("Members Roster");
  }

  spreadsheet.toast("Connecting to cybersecdiu.club...", "Sync in Progress", 3);

  const options = {
    method: "get",
    headers: {
      "Authorization": "Bearer " + SYNC_SECRET,
      "Accept": "application/json"
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(API_URL, options);
    const statusCode = response.getResponseCode();

    if (statusCode === 401) {
      SpreadsheetApp.getUi().alert("Authentication Failed (401): Check your SYNC_SECRET in Apps Script.");
      return;
    }

    if (statusCode !== 200) {
      SpreadsheetApp.getUi().alert("Sync Failed with HTTP status " + statusCode + ": " + response.getContentText());
      return;
    }

    const data = JSON.parse(response.getContentText());

    if (!data.success || !data.headers || !data.rows) {
      SpreadsheetApp.getUi().alert("Invalid response format from server.");
      return;
    }

    // Clear previous contents
    sheet.clear();

    // 1. Write Header Row
    sheet.appendRow(data.headers);

    // Format Header: Dark Cyber Navy background with white text
    const headerRange = sheet.getRange(1, 1, 1, data.headers.length);
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Roboto");
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment("center");

    // Freeze header row
    sheet.setFrozenRows(1);

    // 2. Write Data Rows in batch
    if (data.rows.length > 0) {
      const dataRange = sheet.getRange(2, 1, data.rows.length, data.headers.length);
      dataRange.setValues(data.rows);
      dataRange.setFontFamily("Roboto");
      dataRange.setFontSize(10);
      dataRange.setVerticalAlignment("middle");
      
      // Auto-fit columns
      for (let col = 1; col <= data.headers.length; col++) {
        sheet.autoResizeColumn(col);
      }
    }

    spreadsheet.toast(
      "Successfully synced " + data.totalCount + " members! (Updated at " + new Date().toLocaleTimeString() + ")",
      "Sync Complete",
      5
    );

  } catch (err) {
    Logger.log("Error in syncCyberClubMembers: " + err.toString());
    SpreadsheetApp.getUi().alert("Error syncing data: " + err.toString());
  }
}
