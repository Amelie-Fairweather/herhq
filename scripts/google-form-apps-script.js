/**
 * HER Leadership HQ — Google Form → Onboarding bids bridge
 *
 * SETUP (do this once on the real form):
 * 1. Open your registration form in Google Forms
 * 2. Responses → link a Google Sheet (if not already)
 * 3. In that Sheet: Extensions → Apps Script
 * 4. Delete any placeholder code and paste THIS entire file
 * 5. Edit INGEST_URL below:
 *    - Local testing: use an ngrok/cloudflared URL, e.g.
 *      https://abc123.ngrok-free.app/api/ingest
 *      (Google cannot reach http://localhost:3000)
 *    - Production: https://YOUR-DEPLOYED-HQ/api/ingest
 * 6. Match INGEST_SECRET to .env.local (default: her-form-secret)
 * 7. Save → Triggers (clock icon) → Add trigger:
 *      Function: onFormSubmit
 *      Event source: From spreadsheet
 *      Event type: On form submit
 * 8. Authorize the script when prompted
 * 9. Submit a real test response on the form → it should appear on Bidding
 *
 * Debug: Executions (left sidebar) shows success/fail logs.
 */

const INGEST_URL = "https://YOUR-PUBLIC-HQ-URL/api/ingest";
const INGEST_SECRET = "her-form-secret";

function onFormSubmit(e) {
  try {
    const payload = buildPayload_(e);
    if (!payload.nameAndGrade || !payload.schoolTownState) {
      Logger.log("Missing required fields. Payload: " + JSON.stringify(payload));
      throw new Error("Missing name/grade or school fields from form submit.");
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

/** Map Google Form answers into HER HQ fields. */
function buildPayload_(e) {
  const named = {};
  if (e && e.namedValues) {
    Object.keys(e.namedValues).forEach(function (key) {
      const value = e.namedValues[key];
      named[key] = Array.isArray(value) ? value.join(", ") : String(value || "");
    });
  }

  // Also support form-side triggers that pass e.response
  if (e && e.response && e.response.getItemResponses) {
    e.response.getItemResponses().forEach(function (item) {
      named[item.getItem().getTitle()] = String(item.getResponse() || "");
    });
  }

  function pick() {
    var keys = Array.prototype.slice.call(arguments);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (named[key] != null && String(named[key]).trim() !== "") {
        return String(named[key]).trim();
      }
    }
    // Fuzzy: find a namedValues key that contains a fragment
    for (var j = 0; j < keys.length; j++) {
      var fragment = String(keys[j]).toLowerCase();
      var found = Object.keys(named).find(function (k) {
        return k.toLowerCase().indexOf(fragment) !== -1 && String(named[k]).trim();
      });
      if (found) return String(named[found]).trim();
    }
    return "";
  }

  return {
    nameAndGrade: pick(
      "Your name and grade level (freshman, sophomore, etc)",
      "name and grade",
      "name",
    ),
    schoolTownState: pick(
      "High school, town, and state (ex. Solon High School, Solon, Ohio)",
      "high school",
      "school",
    ),
    coLeaders: pick("Do you have co leaders? If yes, their names?", "co leaders", "co-leaders"),
    contact: pick(
      "Best contact (phone number or email) THIS IS NOT PUBLIC.",
      "best contact",
      "email",
      "phone",
    ),
    heardAbout: pick("How did you hear about us?", "hear about"),
    whyStart: pick("Why do you want to start a HER?", "why do you want", "why start"),
    // Keep originals too (HQ ingest accepts both shapes)
    raw: named,
  };
}

/** Optional: run once in the Apps Script editor to verify the URL/secret. */
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
