import { Principal } from "@dfinity/principal";

/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/ban-types */
/**
 *
 * @param strings - template strings
 * @param values - values to be escaped
 * @returns - escaped string
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]) {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += escapeHtml(values[i]);
    }
  }
  return result;
}

function escapeHtml(unsafe: unknown) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 *
 * @param strings - template strings
 * @param values - values to be escaped
 * @returns - joined string
 */
export function css(strings: TemplateStringsArray, ...values: unknown[]) {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += values[i];
    }
  }
  return result;
}

export const stringify = (x: unknown) =>
  JSON.stringify(x, (_, v) => (typeof v === "bigint" ? v.toString() : v));

export const rehidrateJson = (json: unknown) => {
  if (typeof json !== "object") {
    return json;
  }
  for (const key in json) {
    switch (typeof json[key]) {
      case "object":
        json[key] = rehidrateJson(json[key]);
        break;
      case "string":
        if (key === "__principalAsText") {
          json[key] = Principal.fromText(json[key]);
        } else if (key === "Nat") {
          json[key] = BigInt(json[key]);
        }
        break;
    }
  }
  return json;
};
