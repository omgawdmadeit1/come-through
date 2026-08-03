#!/usr/bin/env node
/**
 * After `npx cap add ios` / `npx cap sync ios`, patch Info.plist usage strings.
 * Safe to re-run. Prefer scripts/ios/bootstrap-mac.sh on a Mac.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const plistPath = path.join(root, "ios/App/App/Info.plist");

const pairs = {
  NSMicrophoneUsageDescription:
    "Come Through needs the microphone so you can hold to talk and send a corrected cut-in message.",
  NSSpeechRecognitionUsageDescription:
    "Come Through can turn your speech into editable text before you send.",
  NSCameraUsageDescription:
    "Come Through does not use the camera; this key satisfies web media permission prompts.",
};

if (!fs.existsSync(plistPath)) {
  console.error("ios/App/App/Info.plist not found. Run: npx cap add ios");
  process.exit(1);
}

let xml = fs.readFileSync(plistPath, "utf8");
for (const [key, value] of Object.entries(pairs)) {
  const re = new RegExp(
    `<key>${key}<\\/key>\\s*<string>[\\s\\S]*?<\\/string>`,
  );
  const block = `<key>${key}</key>\n\t<string>${value}</string>`;
  if (re.test(xml)) {
    xml = xml.replace(re, block);
  } else {
    xml = xml.replace(
      /<\/dict>\s*<\/plist>\s*$/,
      `\t${block}\n</dict>\n</plist>\n`,
    );
  }
}
fs.writeFileSync(plistPath, xml);
console.log("Patched", plistPath);
