# DFN Components Library

This is a library of web components to share Dfinity-customized UI components for a variety of Internet Computer applications

## What's inside?

This library contains the following components:

- [ii-login-button](.packages/ii-login-button)
- [candid-ui](.packages/candid-ui)

## How to use

### Install

```bash
npm install @dfinity/dfn-components
```

### Import

```js
import { defineElement as defineLoginButton } '@dfinity/ii-login-button';
import { defineElement as defineCandidUI } '@dfinity/candid-ui';
```

You can also import the components directly from the `auto.js` file:

```js
import "@dfinity/ii-login-button/auto.js";
import "@dfinity/candid-ui/auto.js";
```

### Use

```html
<ii-login-button></ii-login-button>

<candid-ui></candid-ui>
```

See the READMEs of each component for more details.
