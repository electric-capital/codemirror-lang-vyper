/*
* CodeMirror 6 Vyper Language Support
* based on : https://github.com/replit/codemirror-lang-solidity
* based on : https://github.com/vyperlang/vim-vyper/blob/master/syntax/vyper.vim
*/
import { LanguageSupport, StreamLanguage, StreamParser, StringStream } from '@codemirror/language';

const keywords = {
  import: true,
  from: true,
  as: true,
  contract: true,
  struct: true,
  event: true,
  pass: true,
  pub: true,
  def: true,
  if: true,
  else: true,
  for: true,
  in: true,
  return: true,
  lambda: true,
  or: true,
  and: true,
  not: true,
  assert: true,
  raise: true,
  while: true,
  break: true,
  continue: true,
  global: true,
  nonlocal: true,
  is: true,
  None: true,
  True: true,
  False: true,
  implements: true,
  interface: true,
  log: true
};

const keywordsValueTypes = {
  bool: true,
  byte: true,
  string: true,
  enum: true,
  address: true,
  decimal: true,
  external: true,
  internal: true,
  nonentrant: true,
  pure: true,
  view: true,
  payable: true,
  nonpayable: true,
  public: true,
  indexed: true,
  constant: true,
};

const newTypes = `
  bytes1 bytes2 bytes3 bytes4 bytes5 bytes6 bytes7 bytes8 bytes9 bytes10 bytes11 bytes12 bytes13 bytes14 bytes15 bytes16 bytes17 bytes18 bytes19 bytes20 bytes21 bytes22 bytes23 bytes24 bytes25 bytes26 bytes27 bytes28 bytes29 bytes30 bytes31 bytes32
  int8 int16 int24 int32 int40 int48 int56 int64 int72 int80 int88 int96 int104 int112 int120 int128 int136 int144 int152 int160 int168 int176 int184 int192 int200 int208 int216 int224 int232 int240 int248 int256
  uint8 uint16 uint24 uint32 uint40 uint48 uint56 uint64 uint72 uint80 uint88 uint96 uint104 uint112 uint120 uint128 uint136 uint144 uint152 uint160 uint168 uint176 uint184 uint192 uint200 uint208 uint216 uint224 uint232 uint240 uint248 uint256
  Bytes String HashMap
`.split(/\s+/);

newTypes.forEach(type => {
  keywordsValueTypes[type] = true;
});

const keywordsControlStructures = {
  if: true,
  else: true,
  elif: true,
  for: true,
  while: true,
  in: true,
  and: true,
  or: true,
  not: true,
};

const keywordsBlockAndTransactionProperties = {
  block: ['coinbase', 'difficulty', 'gaslimit', 'number', 'timestamp'],
  msg: ['data', 'sender', 'sig', 'value'],
  tx: ['gasprice', 'origin'],
};
const keywordsMoreBlockAndTransactionProperties = {
  now: true,
  gasleft: true,
  blockhash: true,
};

const keywordsConstants = {
  ZERO_ADDRESS: true,
  EMPTY_BYTES32: true,
  MAX_INT128: true,
  MIN_INT128: true,
  MAX_DECIMAL: true,
  MIN_DECIMAL: true,
  MAX_UINT256: true,
};

const vyperBuiltins = {
  as_unitless_number: true,
  as_wei_value: true,
  bitwise_and: true,
  bitwise_not: true,
  bitwise_or: true,
  bitwise_xor: true,
  blockhash: true,
  ceil: true,
  concat: true,
  convert: true,
  create_with_code_of: true,
  ecadd: true,
  ecmul: true,
  ecrecover: true,
  extract32: true,
  floor: true,
  keccak256: true,
  len: true,
  max: true,
  method_id: true,
  min: true,
  raw_call: true,
  empty: true,
  sha3: true,
  shift: true,
  slice: true,
  uint256_addmod: true,
  uint256_mulmod: true,
  sha256: true,
  pow_mod256: true,
};

const atoms = {
  None: true,
  True: true,
  False: true,
};

const isOperatorChar = /[+\-*&^%:=<>!|/~]/;

const natSpecTags = ['title', 'license', 'author', 'notice', 'dev', 'param', 'return', 'version'];

let curPunc;

function tokenComment(stream, state) {
  var maybeEnd = false, ch;
  while ((ch = stream.next())) {
    if (ch === '"' && maybeEnd) {
      state.tokenize = null;
      break;
    }
    maybeEnd = (ch === '"');
  }
  return "comment";
}

function isNumber(ch: string, stream: StringStream) {
  if (/[\d.]/.test(ch)) {
    if (ch === '.') {
      stream.match(/^[0-9]+([eE][-+]?[0-9]+)?/);
    } else if (ch === '0') {
      if (!stream.match(/^[xX][0-9a-fA-F]+/)) {
        stream.match(/^0[0-7]+/);
      }
    } else {
      stream.match(/^[0-9]*\.?[0-9]*([eE][-+]?[0-9]+)?/);
    }

    return true;
  }
}


function tokenBase(stream: StringStream, state) {
  if (stream.match(/^\s*#pragma.*$/)) {
    return 'meta';
  }

  // consume whitespace
  stream.eatSpace();

  let ch = stream.next();

  if (ch === '"') {
    if (stream.match('""')) {
      state.tokenize = tokenComment;

      return tokenComment(stream, state);
    }
    // ... handle other cases with " here...
  }

  if (typeof ch === 'string' && /[[\]{}(),;:.]/.test(ch)) {
    return updateGarmmer(ch, state);
  }

  if (ch === '#') {
    stream.skipToEnd();
    return 'comment';
  }

  if (ch === '@') {
    stream.eatWhile(/[\w$_]/);
    const decorator = stream.current();
    if (["payable", "nonpayable", "view", "pure", "internal", "external", "nonreentrant"].includes(decorator.substr(1))) {
      return "keyword";
    }
  }

  if (ch === '0' && stream.eat('x')) {
    stream.eatWhile(/[0-9a-fA-F]/);
    return "number";
  }

  if (typeof ch === 'string' && isNumber(ch, stream)) {
    return 'number';
  }

  if (ch === '"' || ch === "'") {
    state.tokenize = tokenString(ch);
    return state.tokenize(stream, state);
  }

  if (typeof ch === 'string' && isOperatorChar.test(ch)) {
    stream.eatWhile(isOperatorChar);
    return 'operator';
  }  

  stream.eatWhile(/[\w$_\xa1-\uffff]/);
  const cur = stream.current();

  if (state.grammar === 'doc') {
    if (
      natSpecTags.some(function (item) {
        return cur === `@${item}`;
      })
    ) {
      return 'docReserve';
    }

    return 'doc';
  }

  if (Object.prototype.propertyIsEnumerable.call(keywords, cur)) {
    return 'keyword';
  }

  if (
    Object.prototype.propertyIsEnumerable.call(
      keywordsControlStructures,
      cur,
    )
  ) {
    return 'keyword';
  }

  if (Object.prototype.propertyIsEnumerable.call(keywordsConstants, cur)) {
    return 'atom';
  }

  if (Object.prototype.propertyIsEnumerable.call(vyperBuiltins, cur)) {
    return 'function';
  }

  if (
    Object.prototype.propertyIsEnumerable.call(keywordsValueTypes, cur)
  ) {
    state.lastToken += 'variable';

    return 'keyword';
  }

  if (
    Object.prototype.propertyIsEnumerable.call(
      keywordsMoreBlockAndTransactionProperties,
      cur,
    ) ||
    (Object.prototype.propertyIsEnumerable.call(
      keywordsBlockAndTransactionProperties,
      cur,
    ) &&
      ((keywordsBlockAndTransactionProperties as any)[cur] as Array<
        string
      >).some(function (item) {
        return stream.match(`.${item}`);
      }))
  ) {
    return 'variable-2';
  }

  if (Object.prototype.propertyIsEnumerable.call(atoms, cur)) {
    return 'atom';
  }

  return 'variable';
}

function tokenString(quote) {
  return function (stream, state) {
    let escaped = false;
    let next;
    let end = false;
    next = stream.next();
    while (next != null) {
      if (next === quote && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && quote !== '`' && next === '\\';
      next = stream.next();
    }
    if (end || !(escaped || quote === '`')) {
      state.tokenize = tokenBase;
    }
    return 'string';
  };
}

function updateGarmmer(ch: string, state: State) {
  if (ch === ',' && state.para === 'functionName(variable') {
    state.para = 'functionName(';
  }

  if (state.para != null && state.para.startsWith('functionName')) {
    if (ch === ')') {
      if (state.para.endsWith('(')) {
        state.para = state.para.substr(0, state.para.length - 1);
        if (state.para === 'functionName') {
          state.grammar = '';
        }
      }
    } else if (ch === '(') {
      state.para += ch;
    }
  }

  if (ch === '(' && state.lastToken === 'functionName') {
    state.lastToken += ch;
  } else if (ch === ')' && state.lastToken === 'functionName(') {
    state.lastToken = null;
  } else if (ch === '(' && state.lastToken === 'returns') {
    state.lastToken += ch;
  } else if (
    ch === ')' &&
    (state.lastToken === 'returns(' || state.lastToken === 'returns(variable')
  ) {
    state.lastToken = null;
  }

  if (ch === '(' && state.lastToken === 'address') {
    state.lastToken += ch;
  }

  curPunc = ch;

  return null;
}

class Context {
  indented: number;
  column: number;
  type: string;
  align: boolean | null;
  prev: Context | null;

  constructor(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
}

function pushContext(state, col, type) {
  state.context = new Context(state.indented, col, type, null, state.context);
  return state.context;
}

function popContext(state) {
  if (!state.context.prev) return;
  const t = state.context.type;
  if (t === ')' || t === ']' || t === '}') {
    state.indented = state.context.indented;
  }
  state.context = state.context.prev;
}

export const parser = {
  startState(indentUnit) {
    return {
      tokenize: null,
      context: new Context(0 - indentUnit, 0, 'top', false, null),
      indented: 0,
      startOfLine: true,
    };
  },

  token(stream, state) {
    const ctx = state.context;
    if (stream.sol()) {
      if (ctx.align == null) ctx.align = false;
      state.indented = stream.indentation();
      state.startOfLine = true;
    }

    if (stream.eatSpace()) return null;
    curPunc = null;
    const style = (state.tokenize || tokenBase)(stream, state);
    if (style === 'comment') return style;
    if (ctx.align == null) ctx.align = true;
    if (curPunc === '{') pushContext(state, stream.column(), '}');
    else if (curPunc === '[') pushContext(state, stream.column(), ']');
    else if (curPunc === '(') pushContext(state, stream.column(), ')');
    else if (curPunc === ctx.type) popContext(state);

    state.startOfLine = false;
    return style;
  },

  indent(state, textAfter, indentContext) {
    if (state.tokenize !== tokenBase && state.tokenize != null) return null;
    const ctx = state.context;
    const firstChar = textAfter && textAfter.charAt(0);
    const closing = firstChar === ctx.type;
    if (ctx.align) return ctx.column + (closing ? 0 : 1);
    return ctx.indented + (closing ? 0 : indentContext.unit);
  },

  closeBrackets: '()[]{}\'\'""``',
  fold: 'brace',
  lineComment: '#',
};

export const vyper = new LanguageSupport(StreamLanguage.define(parser));
