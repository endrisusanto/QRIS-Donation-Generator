/**
 * Calculates the CRC16-CCITT (0xFFFF) checksum for a string.
 * Polynomial: 0x1021
 */
function crc16(str: string): string {
  let crc = 0xffff;
  const strlen = str.length;

  for (let c = 0; c < strlen; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }

  let hex = (crc & 0xffff).toString(16).toUpperCase();
  if (hex.length < 4) {
    hex = '0'.repeat(4 - hex.length) + hex;
  }
  return hex;
}

/**
 * Generates a dynamic QRIS string with the specified amount.
 * 
 * Logic inspired by typical QRIS modifiers:
 * 1. Remove existing CRC (Tag 63).
 * 2. Remove existing Amount (Tag 54) if present to avoid duplicates.
 * 3. Switch Point of Initiation Method (Tag 01) to 12 (Dynamic) or keep as is? 
 *    Standard static is 11, dynamic 12. 
 *    Actually, Tag 01: '11' is Static, '12' is Dynamic.
 *    If we inject an amount, it effectively becomes dynamic for this transaction.
 * 4. Append new Amount (Tag 54).
 * 5. Recalculate and append CRC (Tag 63).
 */
export function generateDynamicQRIS(baseQRIS: string, amount: number): string {
  if (!baseQRIS) return "";

  let qris = baseQRIS;

  // 1. Remove CRC (ID 63) from the end if present
  // A naive approach: Usually tag 63 is the last one.
  // We can look for "6304" near the end.
  const crcIndex = qris.lastIndexOf("6304");
  if (crcIndex !== -1 && crcIndex > qris.length - 10) {
    qris = qris.substring(0, crcIndex);
  }

  // 2. We need to parse the TLV loosely to remove existing amount (ID 54)
  // and Point of Initiation (ID 01) if we want to be strict, but
  // for simple modification, we can try to strip ID 54 if it exists.
  // Regex to find Tag 54: 54 + length (2 digits) + value
  // This is tricky with Regex. Let's do a simple replace if found, 
  // or rebuild the string excluding 54.

  // Robust method: Loop through tags.
  let index = 0;
  let newQrisParts: string[] = [];

  while (index < qris.length) {
    const id = qris.substr(index, 2);
    const lengthStr = qris.substr(index + 2, 2);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length)) break; // Malformed

    const value = qris.substr(index + 4, length);

    // Logic:
    // If ID is 01 (Point of Initiation), we force it to '12' (Dynamic)? 
    // Most static QRIS use '11'. Some parsers might reject if it's '11' but has amount.
    // However, many simple generators just leave it. Let's try to set to '12' just in case,
    // or keep original if user prefers. To be safe, let's keep original unless it causes issues.
    // Re: wimboro/qris, it often changes 01 to 12.

    if (id === '54') {
      // Skip existing amount
    } else if (id === '63') {
      // Skip existing CRC (should be handled before, but good safety)
    } else {
      if (id === '01') {
        // Optional: Force Dynamic. 
        // newQrisParts.push("010212"); 
        // But let's stick to passing through original for compatibility unless we know for sure.
        newQrisParts.push(id + lengthStr + value);
      } else {
        newQrisParts.push(id + lengthStr + value);
      }
    }

    index += 4 + length;
  }

  // 3. Construct new string without amount/CRC
  let cleanQris = newQrisParts.join("");

  // 4. Append Tag 54 (Amount)
  // Value must be string.
  const amountStr = amount.toString();
  const amountLen = amountStr.length.toString().padStart(2, '0');
  cleanQris += "54" + amountLen + amountStr;

  // 5. Append Tag 58 (Country Code) if missing? (Assume base QRIS is valid)
  // 6. Append Tag 53 (Currency) if missing? (Assume base QRIS is valid)

  // 7. Calculate CRC
  cleanQris += "6304"; // Append Tag ID and Length for CRC
  const crc = crc16(cleanQris);

  return cleanQris + crc;
}

export function formatRupiah(amount: number): string {
  // Format with dot separator: Rp 1.000.000
  return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}