/*
 * Robuster CSV-Parser für den deutschen Excel-Export:
 * - erkennt Semikolon oder Komma als Trennzeichen automatisch
 * - versteht Anführungszeichen um Felder mit Kommas/Zeilenumbrüchen
 * - fängt eine falsche Zeichenkodierung ab (Umlaute aus Windows-1252-Exporten)
 */

function detectDelimiter(sampleLine) {
  const semicolons = (sampleLine.match(/;/g) || []).length;
  const commas = (sampleLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseCsvRows(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function parseCsv(text) {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  const delimiter = detectDelimiter(firstLine);
  const rows = parseCsvRows(clean, delimiter);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] || "").trim();
    });
    return obj;
  });
}

function looksMojibake(str) {
  return str.includes("�") || /Ã.|Â./.test(str);
}

async function fetchCsvRows(url) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  let text = new TextDecoder("utf-8").decode(buffer);
  if (looksMojibake(text)) {
    text = new TextDecoder("windows-1252").decode(buffer);
  }

  return parseCsv(text);
}
