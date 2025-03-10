import { getUtilsHelper } from "../buildin-helper/utils";

const UtilsHelper = getUtilsHelper();

const tagRe = /#|\^|\/|>|\{|&|=|!/;
const whiteRe = /\s*/;
const spaceRe = /\s+/;
const equalsRe = /\s*=/;
const curlyRe = /\s*\}/;

function defaultFormatToken(token: string) {
  return token;
}


function isFunction(object) {
  return typeof object === 'function';
}



const regExpTest = RegExp.prototype.test;
function testRegExp(re, string) {
  return regExpTest.call(re, string);
}

const nonSpaceRe = /\S/;
function isWhitespace(string) {
  return !testRegExp(nonSpaceRe, string);
}

function escapeRegExp(string) {
  return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
}

function squashTokens(tokens) {

  const squashedTokens = [];

  let token, lastToken;
  for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i];
    if (token) {
      if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
        lastToken[1] += token[1];
        lastToken[3] = token[3];
      } else {
        squashedTokens.push(token);
        lastToken = token;
      }
    }
  }

  return squashedTokens;
}

function nestTokens(tokens) {
  const nestedTokens = [];
  let collector = nestedTokens;
  let sections = [];

  let token, section;
  for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i];

    switch (token[0]) {
      case '#':
      case '^':
      case '&':
      case '!':
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case '/':
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
    }
  }

  return nestedTokens;
}

function parseTemplate(template, tags) {
  if (!template) return [];

  let lineHasNonSpace = false;
  let sections = [];
  let tokens = [];
  let spaces = [];
  let hasTag = false;
  let nonSpace = false;
  let indentation = '';
  let tagIndex = 0;

  function stripSpace() {
    if (hasTag && !nonSpace) {
      while (spaces.length) {
        delete tokens[spaces.pop()];
      }
    } else {
      spaces = [];
    }
    hasTag = false;
    nonSpace = false;
  }

  let openingTagRe, closingTagRe, closingCurlyRe;
  function compileTags(tagsToCompile) {
    if (typeof tagsToCompile === 'string') {
      tagsToCompile = tagsToCompile.split(spaceRe, 2);
    }

    if (!Array.isArray(tagsToCompile) || tagsToCompile.length !== 2) {
      throw new Error('Invalid tags: ' + tagsToCompile);
    }

    openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*');
    closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]));
    closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]));
  }

  compileTags(tags || buildin.tags);

  const scanner = new Scanner(template);

  let start, type, value, chr, token, openSection;

  while (!scanner.eos()) {
    start = scanner.pos;

    value = scanner.scanUntil(openingTagRe);

    if (value) {
      for (let i = 0, valueLength = value.length; i < valueLength; ++i) {
        chr = value.charAt(i);

        if (isWhitespace(chr)) {
          spaces.push(tokens.length);
          indentation += chr;
        } else {
          nonSpace = true;
          lineHasNonSpace = true;
          indentation += ' ';
        }

        tokens.push(['text', chr, start, start + 1])
        start += 1;

        if (chr === '\n') {
          stripSpace();
          indentation = '';
          tagIndex = 0;
          lineHasNonSpace = false;
        }
      }
    }

    if (!scanner.scan(openingTagRe)) break;

    hasTag = true;
    type = scanner.scan(tagRe) || 'name';
    scanner.scan(whiteRe);

    if (type === '=') {
      value = scanner.scanUntil(equalsRe);
      scanner.scan(equalsRe);
      scanner.scanUntil(closingTagRe);
    } else if (type === '{') {
      value = scanner.scanUntil(closingCurlyRe);
      scanner.scan(curlyRe);
      scanner.scanUntil(closingTagRe);
      type = '&';
    } else {
      value = scanner.scanUntil(closingTagRe);
    }

    if (!scanner.scan(closingTagRe)) {
      throw new Error('Unclosed tag at ' + scanner.pos);
    }

    if (type === ">") {
      token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace];
    } else {
      token = [type, value, start, scanner.pos];
    }

    tagIndex++;
    tokens.push(token);

    if (type === '#' || type === '^' || type === '&' || type === '!') {
      sections.push(token);
    } else if (type === '/') {
      openSection = sections.pop();
      if (!openSection) {
        throw new Error("Unopened section " + value + " at " + start);
      }

      // if (openSection[1] !== value) {
      //   throw new Error("Unclosed section " + openSection[1] + " at " + start);
      // }
    } else if (type === 'name' || type === '{') {
      nonSpace = true;
    } else if (type === '=') {
      compileTags(value);
    }
  }

  stripSpace();

  openSection = sections.pop();


  return nestTokens(squashTokens(tokens));

}

class Scanner {
  string: string;
  tail: string;
  pos: number;
  constructor(template) {
    this.string = template;
    this.tail = template;
    this.pos = 0;
  }

  eos() {
    return this.tail === '';
  }

  scanUntil(re) {
    let index = this.tail.search(re), match;

    switch (index) {
      case -1:
        match = this.tail;
        this.tail = '';
        break;
      case 0:
        match = '';
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  }

  scan(re) {
    const match = this.tail.match(re);

    if (!match || match.index !== 0) {
      return '';
    }

    let string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  }
}

class Write {
  templateCache: any;
  contextView: Record<string, any>;
  constructor() {
    this.templateCache = {
      _cache: {},
      set: function (key, value) {
        this._cache[key] = value;
      },
      get: function (key) {
        return this._cache[key];
      },
      clear: function () {
        this._cache = {};
      }
    }
    this.contextView = {};
  }


  getConfigTags(config) {
    if (Array.isArray(config)) {
      return config;
    } else if (config && typeof config === 'object') {
      return config.tags;
    }
    else {
      return undefined;
    }
  }

  parse(template, tags) {
    const cache = this.templateCache;
    const cacheKey = template + ":" + (tags || buildin.tags).join(':');
    const isCacheEnabled = typeof cache !== 'undefined';
    let tokens = isCacheEnabled ? cache.get(cacheKey) : undefined;
    if (tokens === undefined) {
      tokens = parseTemplate(template, tags);
      isCacheEnabled && cache.set(cacheKey, tokens);
    }
    return tokens;
  }

  render(template, view, globalView, config?) {
    const tags = this.getConfigTags(config);
    const tokens = this.parse(template, tags);
    this.contextView = view;
    const context = (view instanceof Context) ? view : new Context(view, globalView, undefined, undefined, config?.formatToken || defaultFormatToken);
    return this.renderTokens(tokens, context, undefined, template, config);
  }

  renderTokens(tokens, context, partials, originalTemplate, config) {
    let buffer = '';

    let token, symbol, value;
    for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];
      if (symbol === '#') {
        value = this.renderSection(token, context, partials, originalTemplate, config);
      }
      else if (symbol === '^' || symbol === '!') {
        value = this.renderInverted(token, context, partials, originalTemplate, config);
      }
      else if (symbol === '>') {
        value = this.renderPartial(token, context, partials, config);
      }
      else if (symbol === '&') {
        value = this.unescapedValue(token, context, partials, originalTemplate, config);
      }
      else if (symbol === 'name') {
        value = this.escapedValue(token, context, config);
      }
      else if (symbol === 'text') {
        value = this.rawValue(token);
      }

      if (value !== undefined) {
        buffer += value;
      }
    }

    return buffer;
  }

  indentPartial(partial, indentation, lineHasNonSpace) {
    const filteredIndentation = indentation.replace(/[^ \t]/g, '');
    const partialByNl = partial.split('\n');
    for (let i = 0; i < partialByNl.length; i++) {
      if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) {
        partialByNl[i] = filteredIndentation + partialByNl[i];
      }
    }
    return partialByNl.join('\n');
  }

  rawValue(token) {
    return token[1];
  }

  unescapedValue(token, context, partials, originalTemplate, config) {
    const value = context.lookup(token[1]);
    if (value != null && value !== false) {
      return this.renderTokens(token[4], context, partials, originalTemplate, config);
    }
  }

  renderPartial(token, context, partials, config) {
    if (!partials) return;
    const tags = this.getConfigTags(config);
    const value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null) {
      const lineHasNonSpace = token[6];
      const tagIndex = token[5];
      const indentation = token[4];
      let indentedValue = value;
      if (tagIndex == 0 && indentation) {
        indentedValue = this.indentPartial(value, indentation, lineHasNonSpace);
      }
      const tokens = this.parse(indentedValue, tags);
      return this.renderTokens(tokens, context, partials, indentedValue, config);
    }

  }

  renderInverted(token, context, partials, originalTemplate, config) {
    const value = context.lookup(token[1]);
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return this.renderTokens(token[4], context, partials, originalTemplate, config);
    }
  }

  renderSection(token, context, partials, originalTemplate, config) {
    let buffer = '';
    // TODO: 需要优化
    let value = JSON.parse(context.lookup(token[1]));

    if (!value) return;

    if (Array.isArray(value)) {
      for (let j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j], undefined, j), partials, originalTemplate, config);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config);
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate, config);
    }

    return buffer;

  }


  escapedValue(token, context, config) {
    const escape = this.getConfigEscape(config) || buildin.escape;
    const value = context.lookup(token[1]);
    if (value != null) {
      return (typeof value === 'number' && escape === buildin.escape) ? String(value) : escape(value);
    }
  }

  getConfigEscape(config) {
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      return config.escape;
    }
    else {
      return undefined;
    }
  }
}

class Context {
  view: Record<string, any>;
  parent: Context;
  cache: Record<string, any>;
  globalView: Record<string, any>;
  formatToken: (token: string) => string;
  constructor(view, globalView, parentContext, index, formatToken) {
    this.view = parentContext ? {
      ...parentContext.view,
      $item: view || {},
      $parent: parentContext.view,
      $index: index,
    } : view;
    this.parent = parentContext;
    this.cache = { '.': this.view };
    this.globalView = globalView;
    this.formatToken = formatToken;
  }

  push(view, globalView = this.globalView, index, formatToken = this.formatToken) {
    return new Context(view, globalView, this, index, formatToken);
  }

  lookup(name) {
    let cache = this.cache;
    let value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      let context = this;
      while (context) {
        const functionCallString = this.formatToken(name);
        const contextWithGlobal = { ...context.view, __Global__: this.globalView }

        const func = new Function('context', ` { return ${functionCallString} }`);
        value = UtilsHelper.JSONStringify(func(contextWithGlobal));
        // console.log('lookup', value, typeof value);

        context = null;
      }
      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  }
}

const buildin = {
  tags: ['{{', '}}'],
  escape: (a) => a,
}

const write = new Write();

interface Core {
  render: (template: string, view: Record<string, any>, globalView: Record<string, any>, config?: {
    formatToken?: (token: string) => string;
  }) => string;
}

const core: Core = {
  render: (template: string, view: Record<string, any>, globalView: Record<string, any>, config?: Record<string, any>) => {
    return write.render(template, view, globalView, config)
  },
}

export default core;

