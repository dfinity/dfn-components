export class LoginButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // internal styles
    const styleSheet = document.createElement("style");

    styleSheet.textContent = `
  button {
    box-sizing: border-box;
    display: flex;
    background: white;
    width: 100%;
    max-width: 400px;
    cursor: pointer;
    border-radius: 0.375rem;
    border: 1px solid rgb(209, 211, 213);
    transition-duration: .15s;
    transition-property: all;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    padding-bottom: 0.5rem;
    padding-top: 0.5rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    align-items: center;
    font-family: ui-sans-serif, system-ui;
    font-size: 14px;
    box-shadow: none;
    border-image: none;
  }
  button:hover, button:focus {
    background: rgb(244, 250, 255);
    border: 1px solid rgb(89, 147, 252);
  }
  button:active, button:target {
    background: rgb(245, 245, 245);
  }
  span#logo {
    display: flex;
    justify-items: center;
    align-items: center;
  }
  span#label {
    width: 100%;
  }
  svg {
    min-width: 24px;
    max-width: 36px;
    height: 24px;
  }
`;
    if (this.hasAttribute("logo-right")) {
      styleSheet.sheet?.insertRule("button {flex-direction: row-reverse}", 0);
    }
    this.shadowRoot?.append(styleSheet);
  }

  connectedCallback() {
    const login = this.login.bind(this);
    this.shadowRoot?.querySelector("button")?.addEventListener("click", login);
  }

  attributeChangedCallback(attrName: string, oldVal: unknown, newVal: unknown) {
    const button = this.shadowRoot?.querySelector("button") as HTMLButtonElement;
    const styleSheet = this.shadowRoot?.querySelector("style") as HTMLStyleElement;
    switch (attrName) {
      case "disabled": {
        if (typeof newVal === "string") {
          button.setAttribute("disabled", "true");
        } else {
          button.removeAttribute("disabled");
        }
        break;
      }
      case "logo-right": {
        if (typeof newVal === "string") {
          styleSheet.sheet?.insertRule("button {flex-direction: row-reverse}", 0);
        } else {
          styleSheet.sheet?.deleteRule(0);
        }
        break;
      }
      case "label": {
        const label = this.shadowRoot?.querySelector("#label") as HTMLSpanElement | undefined;

        if (label) {
          label.innerText = newVal as string;
        }

        break;
      }
      default: {
        console.log("unhandled attribute change", attrName, oldVal, newVal);
        break;
      }
    }
  }

  static get observedAttributes() {
    return ["onSuccess", "label", "disabled", "logo-right"];
  }

  login(): void {
    console.log("unimplimented");
  }
}
