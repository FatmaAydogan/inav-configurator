import crypto from "node:crypto";
import fs from "node:fs";

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
    console.error("Usage: node scripts/decrypt_firmware_test.mjs input.hex output.hex");
    process.exit(1);
}

const keyHex = process.env.FIRMWARE_KEY_HEX;

if (!keyHex) {
    throw new Error("FIRMWARE_KEY_HEX not found.");
}

const key = Buffer.from(keyHex, "hex");

if (key.length !== 32) {
    throw new Error("Firmware key must be 32 bytes.");
}

// Read the encrypted firmware.
const encryptedData = fs.readFileSync(inputFile, "utf8");

const data = Buffer.from(encryptedData, "base64");

if (data.length <= 28) {
    throw new Error("Encrypted firmware data is invalid or empty.");
}

const iv = data.subarray(0, 12);
const authTag = data.subarray(12, 28);
const encrypted = data.subarray(28);

const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

decipher.setAuthTag(authTag);

const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
]);

// Save the decrypted firmware.
fs.writeFileSync(outputFile, decrypted.toString("utf8"), "utf8");

console.log(`Decrypted firmware created: ${outputFile}`);
