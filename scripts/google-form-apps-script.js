/**
 * HER Leadership HQ — Google Form → Onboarding bids bridge
 *
 * Paste into the RESPONSES SHEET: Extensions → Apps Script
 * INGEST_URL must include https:// and /api/ingest
 *
 * Trigger: onFormSubmit / From spreadsheet / On form submit
 */

const INGEST_URL = "https://herhq-production.up.railway.app/api/ingest";
const INGEST_SECRET = "her-form-secret";

function onFormSubmit(e) {
  try {
    Logger.log("onFormSubmit event keys: " + (e ? Object.keys(e).join(",") : "no-event"));
    const payload = buildPayload_(e);
    Logger.log("Built payload: " + JSON.stringify(payload));

    if (!payload.nameAndGrade || !payload.schoolTownState) {
      // Last-resort: pull the newest row straight from the sheet
      const fallback = readLatestSheetRow_();
      Logger.log("Fallback sheet row: " + JSON.stringify(fallback));
      payload.nameAndGrade = payload.nameAndGrade || fallback.nameAndGrade;
      payload.schoolTownState = payload.schoolTownState || fallback.schoolTownState;
      payload.coLeaders = payload.coLeaders || fallback.coLeaders;
      payload.contact = payload.contact || fallback.contact;
      payload.heardAbout = payload.heardAbout || fallback.heardAbout;
      payload.whyStart = payload.whyStart || fallback.whyStart;
      payload.raw = Object.assign({}, fallback.raw || {}, payload.raw || {});
    }

    if (!payload.nameAndGrade || !payload.schoolTownState) {
      throw new Error(
        "Could not read name/grade or school from the form event or sheet. Check Executions log.",
      );
    }

    const response = UrlFetchApp.fetch(INGEST_URL, {
      method: "post",
      contentType: "application/json",
      headers: { "x-ingest-secret": INGEST_SECRET },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    const body = response.getContentText();
    Logger.log("Ingest status " + code + ": " + body);
    if (code < 200 || code >= 300) {
      throw new Error("Ingest failed: " + code + " " + body);
    }
  } catch (err) {
    Logger.log("onFormSubmit error: " + err);
    throw err;
  }
}

function buildPayload_(e) {
  const named = collectAnswers_(e);

  function pick() {
    var fragments = Array.prototype.slice.call(arguments);
    // Exact key first
    for (var i = 0; i < fragments.length; i++) {
      var key = fragments[i];
      if (named[key] != null && String(named[key]).trim() !== "") {
        return String(named[key]).trim();
      }
    }
    // Fuzzy contains (skip Timestamp)
    for (var j = 0; j < fragments.length; j++) {
      var fragment = String(fragments[j]).toLowerCase();
      var found = Object.keys(named).find(function (k) {
        var lk = k.toLowerCase();
        if (lk.indexOf("timestamp") !== -1) return false;
        return lk.indexOf(fragment) !== -1 && String(named[k]).trim();
      });
      if (found) return String(named[found]).trim();
    }
    return "";
  }

  return {
    nameAndGrade: pick(
      "Your name and grade level (freshman, sophomore, etc)",
      "name and grade",
      "name and grade level",
      "your name",
    ),
    schoolTownState: pick(
      "High school, town, and state (ex. Solon High School, Solon, Ohio)",
      "high school, town, and state",
      "high school",
      "school, town",
    ),
    coLeaders: pick(
      "Do you have co leaders? If yes, their names?",
      "co leaders",
      "co-leaders",
      "coleaders",
    ),
    contact: pick(
      "Best contact (phone number or email) THIS IS NOT PUBLIC.",
      "best contact",
      "phone number or email",
      "contact",
    ),
    heardAbout: pick("How did you hear about us?", "hear about"),
    whyStart: pick("Why do you want to start a HER?", "why do you want", "why start"),
    raw: named,
  };
}

/** Pull answers from namedValues, values+headers, or form response objects. */
function collectAnswers_(e) {
  const named = {};

  if (e && e.namedValues) {
    Object.keys(e.namedValues).forEach(function (key) {
      const value = e.namedValues[key];
      named[String(key).trim()] = Array.isArray(value)
        ? value.join(", ")
        : String(value || "");
    });
  }

  // Spreadsheet trigger also provides e.values in column order
  if (e && e.values && e.values.length) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      for (var i = 0; i < headers.length; i++) {
        const header = String(headers[i] || "").trim();
        if (!header) continue;
        if (named[header] == null || named[header] === "") {
          named[header] = e.values[i] != null ? String(e.values[i]) : "";
        }
      }
    } catch (err) {
      Logger.log("values/header zip failed: " + err);
    }
  }

  if (e && e.response && e.response.getItemResponses) {
    e.response.getItemResponses().forEach(function (item) {
      named[String(item.getItem().getTitle()).trim()] = String(item.getResponse() || "");
    });
  }

  return named;
}

/** Read the last data row from the linked responses sheet. */
function readLatestSheetRow_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return {
      nameAndGrade: "",
      schoolTownState: "",
      coLeaders: "",
      contact: "",
      heardAbout: "",
      whyStart: "",
      raw: {},
    };
  }

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(lastRow, 1, lastRow, lastCol).getValues()[0];
  const named = {};
  for (var i = 0; i < headers.length; i++) {
    const header = String(headers[i] || "").trim();
    if (!header) continue;
    named[header] = values[i] != null ? String(values[i]) : "";
  }

  // Reuse picker by faking an event
  return buildPayload_({ namedValues: named });
}

function testIngestConnection() {
  const response = UrlFetchApp.fetch(INGEST_URL, {
    method: "post",
    contentType: "application/json",
    headers: { "x-ingest-secret": INGEST_SECRET },
    payload: JSON.stringify({
      nameAndGrade: "Apps Script Test, Senior",
      schoolTownState: "Connection Check High, Testville, VT",
      coLeaders: "",
      contact: "test-connection@hereducation.org",
      heardAbout: "Apps Script testIngestConnection()",
      whyStart: "Verifying the form → HQ bridge works.",
    }),
    muteHttpExceptions: true,
  });
  Logger.log(response.getResponseCode() + " " + response.getContentText());
}

/** Manually push the newest sheet row to HQ (use if a response was missed). */
function syncLatestResponse() {
  const payload = readLatestSheetRow_();
  Logger.log("syncLatestResponse payload: " + JSON.stringify(payload));
  if (!payload.nameAndGrade || !payload.schoolTownState) {
    throw new Error("Could not read latest sheet row.");
  }
  const response = UrlFetchApp.fetch(INGEST_URL, {
    method: "post",
    contentType: "application/json",
    headers: { "x-ingest-secret": INGEST_SECRET },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  Logger.log(response.getResponseCode() + " " + response.getContentText());
}
