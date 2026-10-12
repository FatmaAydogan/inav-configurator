import crypto from "node:crypto";
import fs from "node:fs";

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
    console.error("Usage: node scripts/encrypt_firmware.mjs input.hex output.hex");
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

// Read the original firmware file.
const firmware = fs.readFileSync(inputFile, "utf8");

// Generate a new random IV for each firmware file.
const iv = crypto.randomBytes(12);

const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

const encrypted = Buffer.concat([
    cipher.update(firmware, "utf8"),
    cipher.final(),
]);

const authTag = cipher.getAuthTag();

// Store IV + authentication tag + encrypted firmware.
const result = Buffer.concat([
    iv,
    authTag,
    encrypted,
]);

// Save the encrypted data as Base64 text.
fs.writeFileSync(outputFile, result.toString("base64"), "utf8");

console.log(`Encrypted firmware created: ${outputFile}`);