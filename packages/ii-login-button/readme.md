# @dfinity/IILoginButton

To install, run `npm install @dfinity/ii-login-button`

## IILoginButton

Implements a standardized login button for Internet Identity

The simplest way to use this component is to import the `auto.js` file in your application

```html
<script type="module" src="@dfinity/ii-login-button/auto.js"></script>
```

In Javascript, you can import the component and its types with

```js
import { IILoginButton, defineComponent } from "@dfinity/ii-login-button";
defineComponent();
```

### Example

in your application

```html
<ii-login-button></ii-login-button>
```

Once the component is loaded, you can listen for the `ready` event, and set up more advanced configuration options. A common option would be to set `loginOptions`, looking like this:

```ts
const loginButton = document.querySelector("ii-login-button");

const prepareLoginButton = async loginCallback => {
  if (!customElements.get("ii-login-button")) {
    customElements.define("ii-login-button", LoginButton);
  }

  // Once the login button is ready, we can configure it to use Internet Identity
  loginButton?.addEventListener("ready", async event => {
    if (window.location.host.includes("localhost") || window.location.host.includes("127.0.0.1")) {
      loginButton.configure({
        loginOptions: {
          identityProvider: `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`,
        },
      });
    }
  });

  loginButton?.addEventListener("login", async event => {
    const identity = loginButton?.identity;
    window.identity = identity;
    loginCallback();
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  await prepareLoginButton(() => {
    // Do something after login
  });
});
```

### Supported attributes

<table>
  <thead>
    <tr>
      <td>Attribute</td>
      <td>Use</td>
      <td>Default Value</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Label</td>
      <td>Allows you to customize text on the button</td>
      <td><code>"Login With Internet Identity"</code></td>
    </tr>
    <tr>
      <td>Logo-right</td>
      <td>Positions the logo on the right side of the button</td>
      <td><code>false</code></td>
    </tr>
  </tbody>
</table>

### Events

<table>
  <thead>
    <tr>
      <td>Event</td>
      <td>Purpose</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>ready</code></td>
      <td>Fires once the component has loaded</td>
    </tr>
    <tr>
      <td><code>login</code></td>
      <td>fires once the user has finished logging in</td>
    </tr>
  </tbody>
</table>

### Properties

<table>
  <thead>
    <tr>
      <td>Property</td>
      <td>Type</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>authClient</code></td>
      <td><code>AuthClient</code></td>
    </tr>
    <tr>
      <td><code>isAuthenticated</code></td>
      <td><code>boolean</code></td>
    </tr>
    <tr>
      <td><code>identity</code></td>
      <td><code>Identity | undefined</code></td>
    </tr>
    <tr>
      <td><code>principal</code></td>
      <td><code>Principal | undefined</code></td>
    </tr>
    <tr>
      <td><code>principalString</code></td>
      <td><code>string | undefined</code></td>
    </tr>
    <tr>
      <td><code>accountId</code></td>
      <td><code>string | undefined</code></td>
    </tr>
  </tbody>
</table>
