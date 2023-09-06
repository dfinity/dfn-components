/* eslint-disable no-empty */
import {
  Actor,
  ActorSubclass,
  Agent,
  AnonymousIdentity,
  CanisterStatus,
  HttpAgent,
  Identity,
} from '@dfinity/agent';
import { IDL } from '@dfinity/candid';
import { Principal } from '@dfinity/principal';
import { log, renderMethod } from './renderMethod';
import { IdbNetworkIds } from './db';
import { styles } from './styles';
import { html, stringify } from './utils';
import type { CanisterIdInput } from './CanisterIdInput';
import { type Options, type LogLevel, AnonymousAgent } from "./types";

if (!('global' in window)) {
  (window as any).global = window;
}

export class CandidUI extends HTMLElement {
  #identity?: Identity = new AnonymousIdentity();
  #db?: IdbNetworkIds;
  #agent?: HttpAgent;
  #canisterId?: Principal;
  #isLocal = false;
  #host: string = 'https://icp-api.io';
  #title = 'Candid UI';
  #description = 'Browse and test your API with our visual web interface.';
  // restricted set of methods to display
  #methods: string[] = [];
  #isInitialized = false;
  #logLevel: LogLevel = 'none';
  #options?: Options; 

  constructor() {
    super();

    // shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });

    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    shadow.appendChild(styleTag);

    const main = document.createElement('main');
    main.id = 'main';
    shadow.appendChild(main);

    //  create a database
    IdbNetworkIds.create().then(db => {
      this.#db = db;
    });
  }

  //#region Properties
  /**
   * Public Interface
   */
  attributeChangedCallback() {
    this.#log('attribute changed');
    this.#init();
  }

  // Values that can be set via attribute
  static get observedAttributes() {
    return [
      'canisterid',
      'defaultValues',
      'description',
      'host',
      'methods',
      'title',
    ];
  }
  /**
   * setter for host
   */
  set host(host: string | undefined) {
    this.#log('set host');
    if (typeof host === 'string') {
      this.#host = host;
      this.setAttribute('host', host);
      this.#init();
    } else {
      if (typeof host === 'undefined') {
        this.removeAttribute('host');
        this.#init();
      } else {
        throw new Error('host must be a string or undefined');
      }
    }
  }

  get host() {
    return this.#host;
  }

  set title(title: string) {
    this.#log('set title');
    if (typeof title === 'string') {
      this.#title = title;
      this.setAttribute('title', title);
      this.#render();
    } else {
      throw new Error('title must be a string');
    }
  }

  get title() {
    return this.#title;
  }

  set description(description: string) {
    this.#log('set description');
    if (typeof description === 'string') {
      this.#description = description;
      this.setAttribute('description', description);
      this.#render();
    } else {
      throw new Error('description must be a string');
    }
  }

  get description() {
    return this.#description;
  }

  set methods(methods: string[]) {
    this.#log('set methods');
    if (Array.isArray(methods)) {
      this.#methods = methods;
      this.setAttribute('methods', methods.join(','));
      this.#render();
    } else {
      throw new Error('methods must be an array of strings');
    }
  }

  get methods() {
    return this.#methods;
  }

  set logLevel(logLevel) {
    this.#log('set logLevel');
    this.#logLevel = logLevel;
  }

  get logLevel() {
    return this.#logLevel;
  }

  /**
   * functional setter method for canister id for Candid UI to display
   * @param canisterId - canister id
   */
  public setCanisterId(canisterId?: Principal | string): void {
    this.#log('set canister id');
    if (canisterId) {
      this.#canisterId = Principal.from(canisterId);
      this.setAttribute('canisterid', canisterId.toString());
    } else {
      this.#canisterId = undefined;
      this.removeAttribute('canisterid');
    }
    this.#render();
  }

  /**
   * The canister id for Candid UI to display
   */
  set canisterId(canisterId: Principal | string | undefined) {
    this.#log('set canister id');
    this.setCanisterId(canisterId);
  }

  get canisterId() {
    return this.#canisterId?.toString() ?? '';
  }

  /**
   * Setter method for an agent
   * @param agent - an instance of HttpAgent or Agent
   */
  public async setAgent(agent: Agent | HttpAgent) {
    this.#log('set agent');
    this.#agent = agent as HttpAgent;
    if (this.#isLocal) {
      await this.#agent.fetchRootKey();
    }
    await this.#init();
    // await this.#init();
  }

  set agent(agent: Agent | HttpAgent) {
    this.#log('set agent');
    this.setAgent(agent);
  }

  get agent() {
    if (this.#agent) {
      return this.#agent;
    }
    if (this.#identity) {
      return new HttpAgent({ identity: this.#identity });
    }
    return new AnonymousAgent();
  }

  public async setIdentity(identity: Identity | undefined) {
    this.#log('set identity');
    this.#identity = identity;
    this.setAgent(await this.#determineAgent(true));
  }

  set identity(identity: Identity | undefined) {
    this.#log('set identity');
    this.setIdentity(identity);
  }

  get identity() {
    return this.#identity;
  }

  //#endregion

  /**
   * Reset Candid UI
   */
  public reset = () => {
    this.#log('reset');
    this.#db?.clear();
    this.canisterId = undefined;
    this.removeAttribute('canisterid');
    this.host = undefined;
    this.#determineHost().then(host => {
      this.agent = new AnonymousAgent({ host: host });
    });
    const container = this.shadowRoot?.querySelector('#container');
    const input = this.shadowRoot?.querySelector('canister-input') as
      | CanisterIdInput
      | undefined;
    if (input) {
      input.canisterId = undefined;
    }
    if (container) {
      container.innerHTML = '';
    }
    this.#init();
  };

  /**
   * Private Methods
   */

  //   when the custom element is added to the DOM, the connectedCallback() method is called
  #processStyles = async (slot: HTMLSlotElement) => {
    this.#log('process styles');
    slot.assignedNodes().forEach(node => {
      // copy the styles to the shadow DOM
      if (node instanceof HTMLStyleElement) {
        const styleTag = document.createElement('style');
        styleTag.innerHTML = node.innerHTML;
        this.shadowRoot?.appendChild(styleTag);
      }
      // remove the styles from the light DOM
      if (node instanceof HTMLStyleElement) {
        node.remove();
      }
    });
  };

  #log = (message: unknown) => {
    if (this.#logLevel === 'debug') {
      console.groupCollapsed(message);
      console.trace();
      console.groupEnd();
    }
  };

  #error = (message: unknown) => {
    const errorEvent = new CustomEvent('error', {
      detail: message,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(errorEvent);

    if (this.#logLevel === 'debug') {
      console.error(message);
    }
  };

  async connectedCallback() {
    await this.#init();
    const slot = this.shadowRoot?.querySelector(
      'slot[name="styles"]'
    ) as HTMLSlotElement;

    if (slot) {
      this.#processStyles(slot);
    }

    slot?.addEventListener('slotchange', e => {
      this.#processStyles(e.target as HTMLSlotElement);
    });
  }

  async #init() {
    if (this.hasAttribute('loglevel')) {
      if (this.getAttribute('loglevel')?.trim() === 'debug') {
        this.#logLevel = 'debug';
      }
    }
    if (this.#logLevel === 'debug') {
      console.count('init');
    }
    this.#log('init');
    // check if canister id is provided
    if (this.hasAttribute('canisterId')) {
      const canisterId = this.getAttribute('canisterId')?.trim();
      if (canisterId) {
        this.#canisterId = Principal.fromText(canisterId);
      }
    }
    if (this.hasAttribute('methods')) {
      const methods = this.getAttribute('methods')
        ?.trim()
        .split(',')
        .map(method => method.trim());
      if (methods) {
        this.#methods = methods;
      }
    }
    if (this.hasAttribute('options')) {
      const options = this.getAttribute('options');
      if (options) {
        const parsedOptions = JSON.parse(options);
        this.#options = parsedOptions;
      }
    }
    const titleAttribute = this.getAttribute('title');
    if (this.hasAttribute('title') && typeof titleAttribute === 'string') {
      this.#title = titleAttribute;
    }
    const descriptionAttribute = this.getAttribute('description');
    if (
      this.hasAttribute('description') &&
      typeof descriptionAttribute === 'string'
    ) {
      this.#description = descriptionAttribute;
    }
    if (this.hasAttribute('host')) {
      this.#host = this.getAttribute('host') ?? undefined;
    }
    const host = await this.#determineHost();
    this.#host = host;
    this.#isLocal = this.#determineLocal(this.#host);

    if (!this.#agent) {
      this.#agent = await this.#determineAgent();
    }

    await this.#render();

    if (!this.#isInitialized) {
      const { defineCanisterIdInput } = await import('./CanisterIdInput');
      defineCanisterIdInput();
      this.#isInitialized = true;
      this.dispatchEvent(new CustomEvent('ready'));
    }
  }

  #determineLocal(host?: string) {
    this.#log('determine local');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      // set isLocal to false if host is not localhost
      return false;
    } else if (host && location) {
      // otherwise infer from location
      return (
        location.href.includes('localhost') ||
        location.href.includes('127.0.0.1')
      );
    }

    return false;
  }

  #determineHost = async (): Promise<string> => {
    this.#log('determine host');
    if (this.#host) return this.#host;
    let host = '';

    if (
      location.href.includes('localhost') ||
      location.href.includes('127.0.0.1')
    ) {
      console.groupCollapsed('Trying well known local hosts');
      try {
        const proxyResponse = await (await fetch('/api/v2/status')).text();
        if (proxyResponse) {
          host = location.origin;
        }
      } catch (_) {}
      try {
        const defaultLocalResponse = await (
          await fetch('http://127.0.0.1:4943/api/v2/status')
        ).text();
        console.log(defaultLocalResponse);
        if (defaultLocalResponse) {
          host = `http://127.0.0.1:4943`;
        }
      } catch (_) {}
      try {
        const systemLocalResponse = await (
          await fetch('http://127.0.0.1:8080/api/v2/status')
        ).text();

        if (systemLocalResponse) {
          host = `http://127.0.0.1:8080`;
        }
      } catch (_) {}
      console.log(host);
      console.groupEnd();
      if (this.#logLevel === 'debug') {
        if (host) {
          this.#log(`inferred local host: ${host}`);
        } else {
          this.#log('defaulting to https://icp-api.io host');
        }
      }
    }
    return host || `https://icp-api.io`;
  };

  #determineAgent = async (shouldReset = false): Promise<HttpAgent> => {
    this.#log('determine agent');
    if (this.#agent && !shouldReset) return this.#agent;
    let agent;
    if (this.#identity) {
      agent = new HttpAgent({
        identity: this.#identity,
        host: this.#host ?? (await this.#determineHost()),
      });
    } else {
      agent = new AnonymousAgent({
        host: this.#host ?? (await this.#determineHost()),
      });
    }

    if (this.#isLocal) {
      await agent.fetchRootKey();
    }
    return agent;
  };

  #render = async () => {
    this.#log('render');
    this.#renderStatic();
    const agent = this.#agent ?? (await this.#determineAgent());

    if (!this.#canisterId) return;
    let candid = await this.#db?.get(
      stringify({ id: this.#canisterId.toText(), network: this.#host })
    );

    //   fetch the candid file
    try {
      if (!candid) {
        const status = await CanisterStatus.request({
          canisterId: this.#canisterId,
          agent,
          paths: ['candid'],
        });
        candid = status.get('candid') as string | undefined;
      }
      if (!candid) {
        candid = await this.#getDidJsFromTmpHack(this.#canisterId);
      }
      if (!candid) {
        this.#error('Candid file not found');
        return;
      }

      //   save candid file to db
      if (this.#db) {
        this.#db.set(
          stringify({ id: this.#canisterId.toText(), network: this.#host }),
          candid
        );
      }

      const js = await this.#didToJs(candid as string);

      if (!js) {
        throw new Error('Cannot fetch candid file');
      }
      const dataUri =
        'data:text/javascript;charset=utf-8,' + encodeURIComponent(js);
      const candidScript: any = await eval('import("' + dataUri + '")');
      const actor = Actor.createActor(candidScript.idlFactory, {
        agent: this.#agent,
        canisterId: this.#canisterId,
      });
      const sortedMethods = Actor.interfaceOf(actor)._fields.sort(([a], [b]) =>
        a > b ? 1 : -1
      );

      const shadowRoot = this.shadowRoot!;

      shadowRoot.querySelector('#methods')!.innerHTML = '';

      //  if methods are specified, only render those
      if (this.#methods?.length) {
        const methods = sortedMethods.filter(([name]) =>
          this.#methods.includes(name)
        );
        // sort methods by this.#methods
        methods.sort(([a], [b]) => {
          const aIndex = this.#methods.indexOf(a);
          const bIndex = this.#methods.indexOf(b);
          return aIndex > bIndex ? 1 : -1;
        });

        for (const [name, func] of methods) {
          renderMethod(
            actor,
            name,
            func,
            shadowRoot,
            async () => undefined,
            this.#options
          );
        }
        return;
      } else {
        this.#methods = sortedMethods.map(([name]) => name);

        for (const [name, func] of sortedMethods) {
          renderMethod(
            actor,
            name,
            func,
            shadowRoot,
            async () => undefined,
            this.#options)
        }
      }
    } catch (e: unknown) {
      this.#error(e);
      log((e as Error).message, this.shadowRoot!);
    }
  };

  #renderStatic = () => {
    this.#log('render static');
    const shadowRoot = this.shadowRoot!;
    const main = shadowRoot.getElementById('main')!;
    main.innerHTML = '';
    if (main) {
      const template = document.createElement('template');
      template.innerHTML = html`<link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-reboot@4.5.4/reboot.css"
        />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.jsdelivr.net/npm/d3-flame-graph@4.1.3/dist/d3-flamegraph.css"
        />
        <style>
          .ic_progress {
            display: block;
            margin: 50vh auto;
            width: 25vw;
          }
        </style>
        <slot name="styles"></slot>
        <div id="progress">
          <progress class="ic_progress" id="ic-progress">
            Loading Candid UI...
          </progress>
        </div>
        <section id="app" style="display: none">
          <header id="header">
            <div></div>
            <canister-input></canister-input>
            <button type="reset" id="reset-button">reset</button>
          </header>
          <div id="container">
            <div id="main-content">
              <div id="title-card">
                <slot name="title">
                  <h1 id="title">${this.#title}</h1>
                </slot>
                <slot name="description">
                  <p id="description">${this.#description}</p>
                </slot>
              </div>
              <ul id="methods"></ul>
            </div>
            <div id="console">
              <div id="console-bar">
                <button id="output-button">
                  <svg
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="clock-circle"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"
                    ></path>
                    <path
                      d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"
                    ></path>
                  </svg>
                </button>
                <button id="methods-button">
                  <svg
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="unordered-list"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M912 192H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 284H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 284H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM104 228a56 56 0 10112 0 56 56 0 10-112 0zm0 284a56 56 0 10112 0 56 56 0 10-112 0zm0 284a56 56 0 10112 0 56 56 0 10-112 0z"
                    ></path>
                  </svg>
                </button>
              </div>
              <div id="output-pane">
                <div class="console-header">Output Log</div>
                <div id="output-list"></div>
              </div>
              <div id="methods-pane" style="display: none">
                <div class="console-header">Methods</div>
                <ul id="methods-list"></ul>
              </div>
            </div>
          </div>
        </section>`;
      main?.appendChild(template.content.cloneNode(true));
    }
    this.#initializeConsoleControls();
  };

  #getDidJsFromTmpHack = async (canisterId: Principal) => {
    this.#log('getting candid interface from canister');
    const common_interface: IDL.InterfaceFactory = ({ IDL }) =>
      IDL.Service({
        __get_candid_interface_tmp_hack: IDL.Func([], [IDL.Text], ['query']),
      });
    const actor: ActorSubclass = Actor.createActor(common_interface, {
      agent: this.#agent,
      canisterId,
    });
    const candid_source =
      (await actor.__get_candid_interface_tmp_hack()) as string;
    this.#log(candid_source);
    return candid_source;
  };

  #didToJs = async (candid_source: string) => {
    this.#log('converting candid to js');
    // call didjs canister
    const didjs_interface: IDL.InterfaceFactory = ({ IDL }) =>
      IDL.Service({
        did_to_js: IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
      });

    const candidCanister = this.#isLocal
      ? `ryjl3-tyaaa-aaaaa-aaaba-cai`
      : `a4gq6-oaaaa-aaaab-qaa4q-cai`;

    this.#log(`candidCanister: ${candidCanister}`);
    const didjs: ActorSubclass = Actor.createActor(didjs_interface, {
      agent: this.#agent,
      canisterId: candidCanister,
    });
    const js: any = await didjs.did_to_js(candid_source);
    if (Array.isArray(js) && js.length === 0) {
      return undefined;
    }
    return js[0];
  };

  #initializeConsoleControls() {
    this.#log('initializing console controls');
    const consoleEl = this.shadowRoot?.getElementById(
      'console'
    ) as HTMLDivElement;
    const outputButton = this.shadowRoot?.getElementById(
      'output-button'
    ) as HTMLButtonElement;
    const methodsButton = this.shadowRoot?.getElementById(
      'methods-button'
    ) as HTMLButtonElement;
    const resetButton = this.shadowRoot?.getElementById(
      'reset-button'
    ) as HTMLButtonElement;

    const outputPane = this.shadowRoot?.getElementById(
      'output-pane'
    ) as HTMLDivElement;
    const methodsPane = this.shadowRoot?.getElementById(
      'methods-pane'
    ) as HTMLDivElement;

    const buttons: HTMLButtonElement[] = [outputButton, methodsButton];
    const panes: HTMLDivElement[] = [outputPane, methodsPane];

    const app = this.shadowRoot?.getElementById('app');
    const progress = this.shadowRoot?.getElementById('progress');

    // Set canister ID in the header
    const canisterIdInput = this.shadowRoot?.querySelector(
      'canister-input'
    ) as CanisterIdInput;

    if (this.#canisterId) {
      canisterIdInput.setAttribute('canisterid', this.#canisterId.toText());
    }
    const handleChange = (id?: Principal) => {
      this.#log('outer handleChange');
      if (id) {
        this.setCanisterId(id);
      }
    };
    canisterIdInput.addEventListener('change', (e: any) => {
      handleChange(e.detail.canisterId);
    });

    const openConsole = () => {
      this.#log('opening console');
      if (!consoleEl.classList.contains('open')) {
        consoleEl.classList.add('open');
      }
    };
    const toggleConsole = () => {
      this.#log('toggling console');
      if (consoleEl.classList.contains('open')) {
        consoleEl.classList.remove('open');
        buttons.forEach(button => {
          button.classList.remove('active-tab');
          button.blur();
        });
        panes.forEach(pane => {
          pane.style.display = 'none';
        });
      } else {
        consoleEl.classList.add('open');
      }
    };
    outputButton.addEventListener('click', () => {
      if (outputButton.classList.contains('active-tab')) {
        toggleConsole();
      } else {
        openConsole();
        outputPane.style.display = 'block';
        outputButton.classList.add('active-tab');
        methodsPane.style.display = 'none';
        methodsButton.classList.remove('active-tab');
      }
    });
    methodsButton.addEventListener('click', () => {
      if (methodsButton.classList.contains('active-tab')) {
        toggleConsole();
      } else {
        openConsole();
        methodsPane.style.display = 'block';
        methodsButton.classList.add('active-tab');
        outputPane.style.display = 'none';
        outputButton.classList.remove('active-tab');
      }
    });
    resetButton.addEventListener('click', () => {
      this.reset();
    });
    progress!.remove();
    app!.style.display = 'block';
    outputButton.click();
  }
}

/**
 * Define the custom element
 */
export function defineElement() {
  if (!window.customElements.get('candid-ui')) {
    customElements.define('candid-ui', CandidUI);
  } else {
    console.warn('candid-ui already defined');
  }
}
