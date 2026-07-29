/**
 * Calendar Day Automation
 * ------------------------
 * Keeps a "newest day on top" log sheet stocked a month ahead of time.
 * Once a month it inserts one row per day of the *upcoming* calendar month
 * directly above the current topmost data row, and migrates the formulas
 * from that (former) top row into every new row, with relative references
 * automatically adjusted per row.
 *
 * Setup:
 *   1. Open your Google Sheet -> Extensions -> Apps Script.
 *   2. Paste this file's contents in (adjust the CONFIG values below first).
 *   3. Save, then reload the Sheet.
 *   4. Use the new "Calendar Automation" menu -> "Install Monthly Trigger"
 *      to enable automatic monthly runs. Use "Add Upcoming Month Now" to
 *      run it immediately (useful for testing or a one-off catch-up).
 *
 * Assumes row HEADER_ROW is the header, and every row below it is a single
 * calendar day, with DATE_COLUMN holding that row's date. At least one data
 * row must already exist manually (it is used as the formula template).
 */

// ---- CONFIG -----------------------------------------------------------
var SHEET_NAME = 'Sheet1';
var HEADER_ROW = 1;
var DATE_COLUMN = 1;
var TRIGGER_DAY_OF_MONTH = 25; // day of the current month the trigger fires
var TRIGGER_HOUR = 1; // hour of day (0-23), in the script's timezone
// -------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Calendar Automation')
    .addItem('Add Upcoming Month Now', 'addUpcomingMonthRows_')
    .addItem('Install Monthly Trigger', 'installMonthlyTrigger')
    .addItem('Remove Monthly Trigger', 'removeMonthlyTrigger')
    .addToUi();
}

/**
 * Inserts one row per day of the month following the most recently
 * recorded date, above the current top data row, copying formulas/format
 * from that row into each new row. Idempotent: does nothing if the
 * upcoming month is already populated.
 */
function addUpcomingMonthRows_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet not found: ' + SHEET_NAME);
  }

  var firstDataRow = HEADER_ROW + 1;
  if (sheet.getLastRow() < firstDataRow) {
    Logger.log('No data row found at row ' + firstDataRow + '; add one manually first as a formula template.');
    return;
  }

  var lastDateCell = sheet.getRange(firstDataRow, DATE_COLUMN);
  var lastDate = lastDateCell.getValue();
  if (!(lastDate instanceof Date)) {
    Logger.log('Row ' + firstDataRow + ', column ' + DATE_COLUMN + ' does not contain a date.');
    return;
  }
  lastDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  var targetMonthStart = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);
  if (lastDate.getTime() >= targetMonthStart.getTime()) {
    Logger.log('Upcoming month already populated; nothing to do.');
    return;
  }

  var daysInMonth = new Date(targetMonthStart.getFullYear(), targetMonthStart.getMonth() + 1, 0).getDate();
  var lastColumn = sheet.getLastColumn();
  var templateRow = firstDataRow + daysInMonth; // former top row, after the shift

  sheet.insertRowsBefore(firstDataRow, daysInMonth);

  var templateRange = sheet.getRange(templateRow, 1, 1, lastColumn);
  for (var i = 0; i < daysInMonth; i++) {
    var destRow = firstDataRow + i;
    templateRange.copyTo(sheet.getRange(destRow, 1, 1, lastColumn));

    var rowDate = new Date(targetMonthStart.getFullYear(), targetMonthStart.getMonth(), i + 1);
    sheet.getRange(destRow, DATE_COLUMN).setValue(rowDate);
  }
}

/** Creates the monthly time-based trigger, if it doesn't already exist. */
function installMonthlyTrigger() {
  var exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === 'addUpcomingMonthRows_';
  });
  if (exists) {
    Logger.log('Monthly trigger already installed.');
    return;
  }

  ScriptApp.newTrigger('addUpcomingMonthRows_')
    .timeBased()
    .onMonthDay(TRIGGER_DAY_OF_MONTH)
    .atHour(TRIGGER_HOUR)
    .create();
}

/** Removes any existing monthly trigger(s) for this script. */
function removeMonthlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'addUpcomingMonthRows_') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}
