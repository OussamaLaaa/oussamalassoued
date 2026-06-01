#!/usr/bin/env node
/**
 * apply-i18n-comprehensive.mjs — v2 (fixed)
 *
 * Comprehensive i18n replacement script for Personal OS.
 * Fixes:
 *  - Windows backslash import path
 *  - Double-replacement prevention (track replaced ranges)
 *  - Better hook insertion (find first function body {)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const TARGET_DIRS = [
  'src/components/opportunities',
];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && /\.tsx$/.test(e.name)) out.push(full);
    }
  }
  return out;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safe string replacements. [from, to]
 */
const REPS = [
  // Existing top-level keys
  ['"Delete"', 't("Delete", "Delete")'],
  ['"Edit"', 't("Edit", "Edit")'],
  ['"Save"', 't("Save", "Save")'],
  ['"Cancel"', 't("Cancel", "Cancel")'],
  ['"Add"', 't("Add", "Add")'],
  ['"Create"', 't("Create", "Create")'],
  ['"Open"', 't("Open", "Open")'],
  ['"Close"', 't("Close", "Close")'],
  ['"Archive"', 't("Archive", "Archive")'],
  ['"Search"', 't("Search", "Search")'],
  ['"Filter"', 't("Filter", "Filter")'],
  ['"Reset"', 't("Reset", "Reset")'],
  ['"Copy"', 't("Copy", "Copy")'],
  ['"Copied"', 't("Copied", "Copied")'],
  ['"Retry"', 't("Retry", "Retry")'],
  ['"Export"', 't("Export", "Export")'],
  ['"More"', 't("More", "More")'],
  ['"Actions"', 't("Actions", "Actions")'],
  ['"Select"', 't("Select", "Select")'],
  ['"Clear"', 't("Clear", "Clear")'],
  ['"OK"', 't("OK", "OK")'],
  ['"Name"', 't("Name", "Name")'],
  ['"Title"', 't("Title", "Title")'],
  ['"Description"', 't("Description", "Description")'],
  ['"Status"', 't("Status", "Status")'],
  ['"Priority"', 't("Priority", "Priority")'],
  ['"Category"', 't("Category", "Category")'],
  ['"Created"', 't("Created", "Created")'],
  ['"Updated"', 't("Updated", "Updated")'],
  ['"Date"', 't("Date", "Date")'],
  ['"Amount"', 't("Amount", "Amount")'],
  ['"Company"', 't("Company", "Company")'],
  ['"Person"', 't("Person", "Person")'],
  ['"Type"', 't("Type", "Type")'],
  ['"Notes"', 't("Notes", "Notes")'],
  ['"Summary"', 't("Summary", "Summary")'],
  ['"Review"', 't("Review", "Review")'],
  ['"Progress"', 't("Progress", "Progress")'],
  ['"Value"', 't("Value", "Value")'],
  ['"Total"', 't("Total", "Total")'],
  ['"New"', 't("New", "New")'],
  ['"Done"', 't("Done", "Done")'],
  ['"Blocked"', 't("Blocked", "Blocked")'],
  ['"Active"', 't("Active", "Active")'],
  ['"Inactive"', 't("Inactive", "Inactive")'],
  ['"Draft"', 't("Draft", "Draft")'],
  ['"Paid"', 't("Paid", "Paid")'],
  ['"Unpaid"', 't("Unpaid", "Unpaid")'],
  ['"Sent"', 't("Sent", "Sent")'],
  ['"Signed"', 't("Signed", "Signed")'],
  ['"Overdue"', 't("Overdue", "Overdue")'],
  ['"Ready"', 't("Ready", "Ready")'],
  ['"Completed"', 't("Completed", "Completed")'],
  ['"Pending"', 't("Pending", "Pending")'],
  ['"Archived"', 't("Archived", "Archived")'],
  ['"All"', 't("All", "All")'],
  ['"Next Action"', 't("common.nextAction", "Next Action")'],
  ['"Next Follow-up"', 't("common.nextFollowUp", "Next Follow-up")'],
  ['"Follow-up"', 't("common.followup", "Follow-up")'],
  ['"Fit Score"', 't("common.fitScore", "Fit Score")'],
  ['"Decision Power"', 't("common.decisionPower", "Decision Power")'],
  ['"Influence Power"', 't("common.influencePower", "Influence Power")'],
  ['"Relevance"', 't("common.relevance", "Relevance")'],
  ['"Primary"', 't("common.primary", "Primary")'],
  ['"Set Primary"', 't("common.setPrimary", "Set Primary")'],
  ['"Add Contact Method"', 't("common.addContactMethod", "Add Contact Method")'],
  ['"Log Message"', 't("common.logMessage", "Log Message")'],
  ['"Open PDF"', 't("common.openPdf", "Open PDF")'],
  ['"PDF Stored"', 't("common.pdfStored", "PDF Stored")'],
  ['"All statuses"', 't("common.allStatuses", "All statuses")'],
  ['"All priorities"', 't("common.allPriorities", "All priorities")'],
  ['"All types"', 't("common.allTypes", "All types")'],
  ['"Saving..."', 't("common.savingEllipsis", "Saving...")'],
  ['"Loading..."', 't("common.loadingEllipsis", "Loading...")'],
  ['"Generating..."', 't("common.generatingEllipsis", "Generating...")'],
  ['"Analyzing..."', 't("common.analyzingEllipsis", "Analyzing...")'],
  ['"(optional)"', 't("common.optional", "(optional)")'],
  ['"Untitled"', 't("common.untitled", "Untitled")'],
  ['"Save failed. Please try again."', 't("common.saveFailed", "Save failed. Please try again.")'],
  ['"Del"', 't("Del", "Del")'],
  ['"Due"', 't("common.due", "Due")'],
  ['"Deactivate"', 't("common.deactivate", "Deactivate")'],
  ['"Activate"', 't("common.activate", "Activate")'],
  ['"Copy Message Body"', 't("common.copyMessageBody", "Copy Message Body")'],
  ['"Goal"', 't("common.goal", "Goal")'],
  ['"Hook"', 't("common.hook", "Hook")'],
  ['"Message Body"', 't("common.messageBody", "Message Body")'],
  ['"Call Script"', 't("common.callScript", "Call Script")'],
  ['"Objection Handling"', 't("common.objectionHandling", "Objection Handling")'],
  ['"Follow-up Message"', 't("common.followUpMessage", "Follow-up Message")'],
  ['"Audience"', 't("common.audience", "Audience")'],
  ['"Language"', 't("common.language", "Language")'],
  ['"Color"', 't("common.color", "Color")'],
  ['"Label"', 't("common.label", "Label")'],
  ['"Context"', 't("common.context", "Context")'],
  ['"Preview"', 't("common.preview", "Preview")'],
  ['"Signature"', 't("common.signature", "Signature")'],
  ['"Provider"', 't("common.provider", "Provider")'],
  ['"Failed"', 't("common.failed", "Failed")'],
  ['"Success"', 't("common.success", "Success")'],
  ['"Warning"', 't("common.warning", "Warning")'],
  ['"Error"', 't("common.error", "Error")'],
  ['"Account settings"', 't("Account settings", "Account settings")'],
  ['"Security"', 't("Security", "Security")'],
  ['"Logout"', 't("Logout", "Logout")'],
  ['"Signed in"', 't("Signed in", "Signed in")'],
  // Desktop keys
  ['"Personal OS"', 't("Personal OS", "Personal OS")'],
  ['"Notifications"', 't("desktop.Notifications", "Notifications")'],
  ['"Desktop Settings"', 't("desktop.Desktop Settings", "Desktop Settings")'],
  ['"Loading your desktop..."', 't("desktop.Loading your desktop...", "Loading your desktop...")'],
  ['"Desktop items could not be loaded."', 't("desktop.Desktop items could not be loaded.", "Desktop items could not be loaded.")'],
  ['"Continue with built-in apps"', 't("desktop.Continue with built-in apps", "Continue with built-in apps")'],
  ['"New Group"', 't("desktop.New Group", "New Group")'],
  ['"Create group with these shortcuts?"', 't("desktop.Create group with these shortcuts?", "Create group with these shortcuts?")'],
  ['"Create Group"', 't("desktop.Create Group", "Create Group")'],
  ['"Background Type"', 't("desktop.Background Type", "Background Type")'],
  ['"Gradient CSS value"', 't("desktop.Gradient CSS value", "Gradient CSS value")'],
  ['"Image URL"', 't("desktop.Image URL", "Image URL")'],
  ['"Icon Size"', 't("desktop.Icon Size", "Icon Size")'],
  ['"Layout Density"', 't("desktop.Layout Density", "Layout Density")'],
  ['"Save Settings"', 't("desktop.Save Settings", "Save Settings")'],
  ['"Image URL must be http or https."', 't("desktop.Image URL must be http or https.", "Image URL must be http or https.")'],
  ['"Failed to save settings."', 't("desktop.Failed to save settings.", "Failed to save settings.")'],
  ['"Drop to add"', 't("desktop.Drop to add", "Drop to add")'],
  // CRM keys
  ['"Back to CRM"', 't("common.back", "Back")'],
  ['"Company not found."', 't("company.notFound", "Company not found.")'],
  ['"Add Person"', 't("crm.addPerson", "Add Person")'],
  ['"Add Problem Profile"', 't("crm.addProblemProfile", "Add Problem Profile")'],
  ['"Add Outreach Script"', 't("crm.addOutreachScript", "Add Outreach Script")'],
  ['"No company contact methods yet."', 't("crm.noContactMethods", "No company contact methods yet.")'],
  ['"No people linked to this company yet."', 't("crm.noPeopleLinked", "No people linked to this company yet.")'],
  ['"No problem profile yet."', 't("crm.noProblemProfile", "No problem profile yet.")'],
  ['"No outreach script yet."', 't("crm.noOutreachScript", "No outreach script yet.")'],
  ['"No web presence data."', 't("crm.noWebPresence", "No web presence data.")'],
  ['"Copied to clipboard."', 't("common.copiedToClipboard", "Copied to clipboard.")'],
  ['"Delete this contact method?"', 't("confirm.deleteContactMethod", "Delete this contact method?")'],
  ['"Delete this problem profile?"', 't("confirm.deleteProblemProfile", "Delete this problem profile?")'],
  ['"Delete this script?"', 't("confirm.deleteScript", "Delete this script?")'],
  ['"Delete this person?"', 't("confirm.deletePerson", "Delete this person?")'],
  ['"Delete this message?"', 't("confirm.deleteMessage", "Delete this message?")'],
  ['"Delete this deal?"', 't("confirm.deleteDeal", "Delete this deal?")'],
  ['"Unable to save notes."', 't("error.unableToSaveNotes", "Unable to save notes.")'],
  ['"Open Person"', 't("crm.openPerson", "Open Person")'],
  ['"Database Type"', 't("crm.databaseType", "Database Type")'],
  ['"Ethical Fit"', 't("crm.ethicalFit", "Ethical Fit")'],
  ['"Reset Opportunities OS demo data to the original seed data?"', 't("confirm.Reset demo data?", "Reset Opportunities OS demo data to the original seed data?")'],
];

/**
 * Replace string occurrences, preventing double-nesting.
 * Uses a single pass per replacement string.
 */
function applyReplacements(content) {
  let out = content;

  for (const [from, to] of REPS) {
    const escaped = escapeRegExp(from);
    // Skip if preceded by t( (already wrapped)
    const regex = new RegExp(`(?<!t\\s*\\()${escaped}`, 'g');
    // Replace and track
    out = out.replace(regex, (match, offset) => {
      return `{${to}}`;
    });
  }

  return out;
}

function ensureImport(content, filePath) {
  if (content.includes('usePersonalLanguage')) return content;

  const normalizedPath = filePath.replace(/\\/g, '/');
  const depth = normalizedPath.includes('src/components/opportunities')
    ? "../../i18n/usePersonalLanguage"
    : "../i18n/usePersonalLanguage";

  const importStatement = `import { usePersonalLanguage } from '${depth}';\n`;

  const match = content.match(/^import\s/m);
  if (match) {
    return content.slice(0, match.index) + importStatement + content.slice(match.index);
  }
  return importStatement + '\n' + content;
}

function ensureHook(content) {
  if (/const\s*\{[^}]*t[^}]*\}\s*=\s*usePersonalLanguage/.test(content)) return content;

  // Find first function body opening { that looks like a React component
  // Search for pattern like: ComponentName = (...) => { or ComponentName: React.FC... = (...) => {
  const fcArrow = /const\s+\w+\s*(?::\s*React\.FC(?:<[^>]*>)?)?\s*=\s*(?:\([^)]*\)\s*(:\s*\w+\s*)?=>\s*)?{/;
  const fcFunction = /function\s+\w+\s*\([^)]*\)\s*(:\s*\w+\s*)?{/;

  const matchArrow = content.match(fcArrow);
  const matchFunction = content.match(fcFunction);

  let match;
  if (matchArrow && matchFunction) {
    match = matchArrow.index < matchFunction.index ? matchArrow : matchFunction;
  } else {
    match = matchArrow || matchFunction;
  }

  if (match) {
    const braceIdx = match[0].lastIndexOf('{');
    if (braceIdx !== -1) {
      const insertPoint = match.index + braceIdx + 1;
      return content.slice(0, insertPoint) + '\n  const { t, language } = usePersonalLanguage();\n' + content.slice(insertPoint);
    }
  }

  return content;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const before = content;
  content = applyReplacements(content);
  const hasChanges = content !== before;

  if (hasChanges && content.includes('t(')) {
    content = ensureImport(content, filePath);
    content = ensureHook(content);
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function main() {
  const files = [];
  for (const t of TARGET_DIRS) {
    const full = path.join(ROOT, t);
    if (fs.existsSync(full)) files.push(...walk(full));
  }

  const skip = new Set(['noteCategoryUtils.ts', 'contactHelpers.tsx', 'leadResearchPlaybookData.ts']);

  let changedCount = 0;
  const changedFiles = [];

  for (const f of files) {
    const basename = path.basename(f);
    if (skip.has(basename)) continue;

    try {
      const changed = processFile(f);
      if (changed) {
        changedCount++;
        changedFiles.push(path.relative(ROOT, f).replace(/\\/g, '/'));
      }
    } catch (err) {
      console.error('Error:', path.relative(ROOT, f), err.message);
    }
  }

  console.log('────────────────────────────');
  console.log('i18n Comprehensive Replacement v2');
  console.log('────────────────────────────');
  console.log('Files scanned:', files.length);
  console.log('Files changed:', changedCount);
  console.log('');
  for (const f of changedFiles) console.log('  ✓', f);
}

main();