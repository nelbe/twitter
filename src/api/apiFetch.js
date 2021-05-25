export class ApiFetch {
  constructor(config) {
    this.config = config;
    this.parseConfig();
    // Add a controller to support aborting ongoing request
    // See: https://caniuse.com/abortcontroller
    this.controller = new AbortController();
  }

  parseConfig() {
    if (this.config) {
      let { rootURL, apiURLPrefix, authorizationPrefix } = this.config;

      if (!rootURL) {
        if (!process.env.REACT_APP_API_URL) {
          throw Error('REACT_APP_API_URL is required when no rootURL is setted');
        }

        rootURL = process.env.REACT_APP_API_URL;
      }
      this.rootURL = new URL('/', rootURL).toString();

      this.basePrefix = rootURL.replace(this.rootURL, '');
      this.basePrefix = `/${this.basePrefix}`;
      this.basePrefix = this.basePrefix === '/' ? '' : this.basePrefix;

      this.authorizationPrefix = authorizationPrefix || process.env.REACT_APP_TOKEN_PREFIX || 'Bearer';
      this.allowForbidden = this.config.allowForbidden || false;

      this.apiURLPrefix = apiURLPrefix || process.env.REACT_APP_API_URL_PREFIX || '/';
      if (!this.apiURLPrefix.endsWith('/')) {
        this.apiURLPrefix += '/';
      }

      this.endpoints = this.config.endpoints;
      Object.keys(this.endpoints).forEach((endpoint) => {
        this.endpoints[endpoint].successReturnCode = this.endpoints[endpoint].successReturnCode || 200;
      });
    }
  }

  renderURL(url, params) {
    let returnUrl = url;
    Object.keys(params).forEach((key) => {
      returnUrl = returnUrl.replace(`:${key}:`, params[key]);
    });
    return returnUrl;
  }

  buildHeaders(customHeaders, config) {
    const headers = { ...customHeaders };

    if (config.jsonContent) {
      headers['Content-Type'] = 'application/json';
    }

    if (config.fileContent) {
      headers['Accept'] = '*/*';
    }

    return headers;
  }

  sendRequest(endpoint, params = {}, body = null, customHeaders = {}) {
    const config = this.endpoints[endpoint];
    if (!config) {
      return;
    }

    const baseUrl = this.apiURLPrefix + config.url;
    const url = new URL(baseUrl, this.rootURL);
    const method = config.method;

    if (method === 'GET') {
      Object.keys(params).forEach((key) => {
        if (config.url.indexOf(`:${key}:`) === -1) {
          url.searchParams.append(key, params[key]);
        }
      });
    }

    const renderedURL = this.renderURL(url.toString(), params);
    const headers = this.buildHeaders(customHeaders, config);
    const signal = this.controller.signal;

    let callParams = { headers, method, signal };
    if (method !== 'GET') {
      if (config.jsonContent) {
        callParams = { ...callParams, body: JSON.stringify(body || {}) };
      }
      if (config.multipartContent) {
        callParams = { ...callParams, body };
      }
    }

    return fetch(renderedURL, callParams);
  }

  getResponse(endpoint, callback, params = {}, body = null, customHeaders = {}) {
    if (endpoint.mockResponse) {
      return callback(endpoint.mockResponse, null);
    }

    const config = this.endpoints[endpoint];
    this.sendRequest(endpoint, params, body, customHeaders)
      .then((r) => {
        if (r.status === config.successReturnCode) {
          if (config.fileContent) {
            r.blob().then((response) => callback(response, null));
          } else {
            // NOTE: The response text must be read in order for the callback to be
            //       called for no content responses for a JSON request.
            if (config.jsonContent === false || Number(r.status) === 204) {
              r.text().then((response) => callback(response, null));
            } else {
              r.json().then((response) => callback(response, null));
            }
          }
        } else if (Number(r.status) === 405) {
          r.json().then((response) => callback(null, response));
        } else {
          return callback(null, { status: r.status, error: r.statusText });
        }
      })
      .catch((e) => {
        return callback(null, { status: 500, error: 'Internal Server Error', errorObject: e });
      });
  }

  // Abort the ongoing request
  abort() {
    this.controller.abort();
  }
}
