/**
 * ==============================================================================
 * EDSTAQ ADMIN PANEL - GOOGLE APPS SCRIPT DATA BRIDGE
 * ==============================================================================
 * This script connects your two live Google Spreadsheets to the Edstaq Admin Panel:
 * 1. HR & Sales Spreadsheet
 * 2. Classroom & Session Mng Spreadsheet
 *
 * Deploy this script as a Web App (Execute as: Me, Access: Anyone).
 */

// Configuration: Replace with your Spreadsheet IDs if they ever change
var SPREADSHEET_IDS = {
  HR_AND_SALES: "1ZgBm9UTj9JIpQ_Iq2V8O8IVPNNXUazntu-KrLpORg_I",
  CLASSROOM_MNG: "16TYFgItwYH8VgNK_Hpn7BeDQ-xMt41pS2ZD8dLeAJLw"
};

/**
 * HTTP GET Endpoint
 * Returns JSON containing data from the requested tabs or all tabs.
 *
 * Query Parameters:
 *   - ?action=all (Default: returns all 5 datasets)
 *   - ?action=teachers
 *   - ?action=availability
 *   - ?action=subjects
 *   - ?action=teacher_assign
 *   - ?action=class_master
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = (params.action || "all").toLowerCase();

    var result = {};

    if (action === "all" || action === "teachers" || action === "availability" || action === "subjects" || action === "reviews" || action === "teacher_reviews") {
      var hrSs = SpreadsheetApp.openById(SPREADSHEET_IDS.HR_AND_SALES);
      
      if (action === "all" || action === "teachers") {
        result.teachers = getSheetData(hrSs, "Teacher");
      }
      if (action === "all" || action === "availability") {
        result.teacherAvailability = getSheetData(hrSs, "Teacher Availability");
      }
      if (action === "all" || action === "subjects") {
        result.subjects = getSheetData(hrSs, "Subjects");
      }
      if (action === "all" || action === "reviews" || action === "teacher_reviews") {
        var reviewSheet = findSheetCaseInsensitive(hrSs, [
          "Teacher Review", 
          "Teaching Review", 
          "Teacher Reviews", 
          "Teaching Reviews", 
          "Reviews", 
          "Review"
        ]);
        result.teacherReviews = reviewSheet ? getSheetData(hrSs, reviewSheet.getName()) : [];
      }
      if (action === "all" || action === "declines" || action === "teacher_declines") {
        var declineSheet = findSheetCaseInsensitive(hrSs, [
          "Teacher Decline",
          "Teacher Declines",
          "Declines",
          "Decline"
        ]);
        result.teacherDeclines = declineSheet ? getSheetData(hrSs, declineSheet.getName()) : [];
      }
    }

    if (action === "all" || action === "teacher_assign" || action === "class_master") {
      var classSs = SpreadsheetApp.openById(SPREADSHEET_IDS.CLASSROOM_MNG);
      
      if (action === "all" || action === "teacher_assign") {
        result.teacherAssign = getSheetData(classSs, "Teacher Assign");
      }
      if (action === "all" || action === "class_master") {
        result.classMaster = getSheetData(classSs, "Class Master");
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      timestamp: new Date().toISOString(),
      data: result
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper function to read a sheet's headers and rows into an array of objects
 */
function getSheetData(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    return [];
  }

  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) {
    return [];
  }

  var headers = values[0].map(function(h) { return h.trim(); });
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var isRowEmpty = row.every(function(cell) { return cell.trim() === ""; });
    if (isRowEmpty) continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      if (header) {
        obj[header] = row[j] !== undefined ? row[j] : "";
      }
    }
    rows.push(obj);
  }

  return rows;
}

/**
 * Helper function to find a sheet matching any of the candidate names case-insensitively with trimmed whitespace
 */
function findSheetCaseInsensitive(spreadsheet, possibleNames) {
  var sheets = spreadsheet.getSheets();
  var normalizedPossibles = possibleNames.map(function(n) { return n.toLowerCase().trim(); });
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName().toLowerCase().trim();
    if (normalizedPossibles.indexOf(name) !== -1) {
      return sheets[i];
    }
  }
  return null;
}

/**
 * HTTP POST Endpoint
 * Supports logging new teacher declines directly into the Google Sheet.
 */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var action = (data.action || "").toLowerCase();

    if (action === "add_decline") {
      var hrSs = SpreadsheetApp.openById(SPREADSHEET_IDS.HR_AND_SALES);
      var declineSheet = findSheetCaseInsensitive(hrSs, [
        "Teacher Decline",
        "Teacher Declines",
        "Declines",
        "Decline"
      ]);

      if (!declineSheet) {
        // Automatically create tab with headers if not yet created
        declineSheet = hrSs.insertSheet("Teacher Decline");
        declineSheet.appendRow([
          "Timestamp",
          "Teacher ID",
          "Teacher Name",
          "Reason",
          "Policy Violation",
          "Student / Subject Note",
          "Remarks"
        ]);
      }

      var timestamp = data.timestamp || new Date().toISOString();
      var teacherId = data.teacherId || "";
      var teacherName = data.teacherName || "";
      var reason = data.reason || "";
      var policyViolation = data.policyViolation ? "TRUE" : "FALSE";
      var note = data.note || "";
      var remarks = data.remarks || "";

      declineSheet.appendRow([
        timestamp,
        teacherId,
        teacherName,
        reason,
        policyViolation,
        note,
        remarks
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Decline recorded successfully"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "add_assign" || action === "add_allocation") {
      var classSs = SpreadsheetApp.openById(SPREADSHEET_IDS.CLASSROOM_MNG);
      var assignSheet = classSs.getSheetByName("Teacher Assign");

      if (!assignSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Sheet 'Teacher Assign' not found in Classroom Mng spreadsheet"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var assignId = data["Teacher Assign ID"] || data.teacherAssignId || ("TAS" + (assignSheet.getLastRow() + 100));
      var classRoomId = data["Class Room ID"] || data.classRoomId || "";
      var meetLink = data["Meet Link"] || data.meetLink || "";
      var subjectId = data["Subject ID"] || data.subjectId || "";
      var studentId = data["Student ID"] || data.studentId || "";
      var teacherId = data["Teacher ID"] || data.teacherId || "";
      var startDate = data["Start Date"] || data.startDate || "";
      var sessionsPerDay = data["Sessions per day"] || data.sessionsPerDay || "1";
      var startTime = data["Start Time"] || data.startTime || "";
      var endTime = data["End Time"] || data.endTime || "";
      var days = data["Days"] || data.days || "";
      var status = data["Status"] || data.status || "Active";
      var weekCycle = data["Week Cycle"] || data.weekCycle || "1";
      var endDateReq = data["End Date Req"] || data.endDateReq || "";
      var classCountReq = data["Class Count Req"] || data.classCountReq || "";
      var studentLimit = data["Student Limit"] || data.studentLimit || "1";
      var classesPaymentMode = data["Classes Payment Mode"] || data.classesPaymentMode || "After";
      var periodInDays = data["Period in Days"] || data.periodInDays || "10";
      var interactiveSession = data["Interactive Session"] || data.interactiveSession || "TRUE";
      var statusSummary = data["Status Summary"] || data.statusSummary || "";
      var paymentNote = data["Payment Note"] || data.paymentNote || "";
      var neurostack = data["Neurostack"] || data.neurostack || "TRUE";
      var subscriptions = data["Subscriptions"] || data.subscriptions || "";

      assignSheet.appendRow([
        assignId,
        classRoomId,
        meetLink,
        subjectId,
        studentId,
        teacherId,
        startDate,
        sessionsPerDay,
        startTime,
        endTime,
        days,
        status,
        weekCycle,
        endDateReq,
        classCountReq,
        studentLimit,
        classesPaymentMode,
        periodInDays,
        interactiveSession,
        statusSummary,
        paymentNote,
        neurostack,
        subscriptions
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Teacher allocation added successfully",
        assignId: assignId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unsupported action"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
