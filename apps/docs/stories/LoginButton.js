import { html } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import "./button.css";
import { IILoginButton } from "@dfinity/ii-login-button";

/**
 * Primary UI component for user interaction
 */
export const LoginButton = ({ label, disabled }) => {
  return html` <ii-login-button label=${label}> </ii-login-button> `;
};
