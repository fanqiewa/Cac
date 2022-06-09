"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

var events = require("events");

function toArr(any) {
  return any == null ? [] : Array.isArray(any) ? any : [any];
}

function toVal(out, key, val, opts) {
	var x, old=out[key], nxt=(
		!!~opts.string.indexOf(key) ? (val == null || val === true ? '' : String(val))
		: typeof val === 'boolean' ? val
		: !!~opts.boolean.indexOf(key) ? (val === 'false' ? false : val === 'true' || (out._.push((x = +val,x * 0 === 0) ? x : val),!!val))
		: (x = +val,x * 0 === 0) ? x : val
	);
	out[key] = old == null ? nxt : (Array.isArray(old) ? old.concat(nxt) : [old, nxt]);
}

function mri2 (args, opts) {
	args = args || [];
	opts = opts || {};

	var k, arr, arg, name, val, out={ _:[] };
	var i=0, j=0, idx=0, len=args.length;

	const alibi = opts.alias !== void 0;
	const strict = opts.unknown !== void 0;
	const defaults = opts.default !== void 0;

	opts.alias = opts.alias || {};
	opts.string = toArr(opts.string);
	opts.boolean = toArr(opts.boolean);

	if (alibi) {
		for (k in opts.alias) {
			arr = opts.alias[k] = toArr(opts.alias[k]);
			for (i=0; i < arr.length; i++) {
				(opts.alias[arr[i]] = arr.concat(k)).splice(i, 1);
			}
		}
	}

	for (i=opts.boolean.length; i-- > 0;) {
		arr = opts.alias[opts.boolean[i]] || [];
		for (j=arr.length; j-- > 0;) opts.boolean.push(arr[j]);
	}

	for (i=opts.string.length; i-- > 0;) {
		arr = opts.alias[opts.string[i]] || [];
		for (j=arr.length; j-- > 0;) opts.string.push(arr[j]);
	}

	if (defaults) {
		for (k in opts.default) {
			name = typeof opts.default[k];
			arr = opts.alias[k] = opts.alias[k] || [];
			if (opts[name] !== void 0) {
				opts[name].push(k);
				for (i=0; i < arr.length; i++) {
					opts[name].push(arr[i]);
				}
			}
		}
	}

	const keys = strict ? Object.keys(opts.alias) : [];

	for (i=0; i < len; i++) {
		arg = args[i];

		if (arg === '--') {
			out._ = out._.concat(args.slice(++i));
			break;
		}

		for (j=0; j < arg.length; j++) {
			if (arg.charCodeAt(j) !== 45) break; // "-"
		}

		if (j === 0) {
			out._.push(arg);
		} else if (arg.substring(j, j + 3) === 'no-') {
			name = arg.substring(j + 3);
			if (strict && !~keys.indexOf(name)) {
				return opts.unknown(arg);
			}
			out[name] = false;
		} else {
			for (idx=j+1; idx < arg.length; idx++) {
				if (arg.charCodeAt(idx) === 61) break; // "="
			}

			name = arg.substring(j, idx);
			val = arg.substring(++idx) || (i+1 === len || (''+args[i+1]).charCodeAt(0) === 45 || args[++i]);
			arr = (j === 2 ? [name] : name);

			for (idx=0; idx < arr.length; idx++) {
				name = arr[idx];
				if (strict && !~keys.indexOf(name)) return opts.unknown('-'.repeat(j) + name);
				toVal(out, name, (idx + 1 < arr.length) || val, opts);
			}
		}
	}

	if (defaults) {
		for (k in opts.default) {
			if (out[k] === void 0) {
				out[k] = opts.default[k];
			}
		}
	}

	if (alibi) {
		for (k in out) {
			arr = opts.alias[k] || [];
			while (arr.length > 0) {
				out[arr.shift()] = out[k];
			}
		}
	}

	return out;
}

// 移除括号
// e.g. 
// input: '--config <file>, -c <file>'
// output: '--config'
const removeBrackets = (v) => v.replace(/[<[].+/, "").trim();
const findAllBrackets = (v) => {
  // 匹配尖叫括号
  const ANGLED_BRACKET_RE_GLOBAL = /<([^>]+)>/g;
  // 匹配方括号
  const SQUARE_BRACKET_RE_GLOBAL = /\[([^\]]+)\]/g;
  const res = [];
  const parse = (match) => {
    let variadic = false;
    let value = match[1];
    if (value.startsWith("...")) {
      value = value.slice(3);
      variadic = true;
    }
    return {
      required: match[0].startsWith("<"),
      value,
      variadic
    }
  }
  let angledMatch;
  while (angledMatch = ANGLED_BRACKET_RE_GLOBAL.exec(v)) {
    res.push(parse(angledMatch));
  }
  let squareMatch;
  while (squareMatch = SQUARE_BRACKET_RE_GLOBAL.exec(v)) {
    res.push(parse(squareMatch));
  }
  return res;
};
// 获取扫描options
const getMriOptions = (options) => {
  const result = { alias: {}, boolean: [] };
  for (const [index, option] of options.entries()) {
    if (option.names.length > 1) {
      result.alias[option.names[0]] = option.names.slic(1);
    }
    if (option.isBoolean /* option名称没有`<`尖括号或者`[`中括号 */) {
      if (option.negated) {
        const hasStringTypeOption = options.some((o, i) => {
          return i !== index && o.names.some((name) => option.names.includes(name)) && typeof o.required === "boolean";
        });
        if (!hasStringTypeOption) {
          result.boolean.push(option.names[0]);
        }
      } else {
        result.boolean.push(option.names[0]);
      }
    }
  }
  return result;
}
// 获取数组中字符串最长的一项
const findLongest = (arr) => {
  return arr.sort((a, b) => {
    return a.length > b.length ? -1 : 1;
  })[0];
}

// padding-right
const padRight = (str, length) => {
  return str.length >= length ? str : `${str}${" ".repeat(length - str.length)}`;
}

const camelcase = (input) => {
  return input.replace(/([a-z])-([a-z])/g, (_, p1, p2) => {
    return p1 + p2.toUpperCase();
  });
};
// 设置命令的属性值
const setDotProp = (obj, keys, val) => {
  let i = 0;
  let length = keys.length;
  let t = obj;
  let x;
  for (; i < length; ++i) {
    x = t[keys[i]];
    t = t[keys[i]] = i === length - 1 ? val : x != null ? x : !!~keys[i + 1].indexOf(".") || !(+keys[i + 1] > -1) ? {} : [];
  }
}
// 设置转换函数
const setByType = (obj, transforms) => {
  for (const key of Object.keys(transforms)) {
    const transform = transforms[key];
    if (transforms.shouldTransform) {
      obj[key] = Array.prototype.concat.call([], obj[key]);
      if (typeof transforms.transformFunction === "function") {
        obj[key] = obj[key].map(transform.transformFunction);
      }
    }
  }
}

// 获取文件名称
const getFileName = (input) => {
  // e.g. /([^\\\/]+)$/.exec('h:\\-----------------------------\\myVue\\vue3\\Cac\\demo.js')
  // 输出：["demo.js", "demo.js", index: 48, input: "h:\-----------------------------\myVue\vue3\Cac\demo.js", groups: undefined]
  const m = /([^\\\/]+)$/.exec(input);
  return m ? m[1] : "";
}
// 驼峰命名法
const camelcaseOptionName = (name) => {
  return name.split(".").map((v, i) => {
    return i === 0 ? camelcase(v) : v;
  }).join(".");
}
class CACError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

// options配置项的基类
class Option {
  constructor(rawName, description, config) {
    this.rawName = rawName;
    this.description = description;
    this.config = Object.assign({}, config);
    // 将 `.`和 `*` 去掉
    rawName = rawName.replace(/\.\*/g, "");
    // 否定标志
    this.negated = false;
    this.names = removeBrackets(rawName).split(",").map((v) => {
      // 多个rawName
      // e.g. '-h, --help'
      // 输出：['h', 'help']
      let name = v.trim().replace(/^-{1,2}/, "");
      if (name.startsWith("no-")) {
        // e.g. 'no--port'
        this.negated = true;
        name = name.replace(/^no-/, "");
      }
      return camelcaseOptionName(name);
    }).sort((a, b) => a.length > b > length ? 1 : -1);
    this.name = this.names[this.names.length - 1];
    if (this.negated && this.config.default == null) {
      this.config.default = true;
    }
    
    if (rawName.includes("<")) {
      // 尖括号名称表示必输
      // e.g. '--port <port>' 
      this.require = true;
    } else if (rawName.includes("[")) {
      // 中括号名称表示可输
      this.require = false;
    } else {
      this.isBoolean = true;
    }
  }
}

const processArgs = process.argv;

class Command {
  constructor(rawName, description, config = {}, cli) {
    this.rawName = rawName;
    this.description = description;
    this.config = config;
    this.cli = cli;
    this.options = [];
    this.aliasNames = [];
    this.name = removeBrackets(rawName);
    this.args = findAllBrackets(rawName);
    this.examples = [];
  }
  // 使用
  usage(text) {
    this.usageText = text;
    return this;
  }
  // 允许此命令中的未知选项，默认情况下，当使用未知选项时，CAC将记录错误。
  allowUnknownOptions() {
    this.config.allowUnknownOptions = true;
    return this;
  }
  // 在解析的选项中不使用选项的默认值，只在帮助消息中显示它们。
  ignoreOptionDefaultValue() {
    this.config.ignoreOptionDefaultValue = true;
    return this;
  }
  /**
   * 定义版本号
   * @param {String} version 版本号
   * @param {String} customFlags 自定义输入命令
   */
  version(version, customFlags = "-v, --version") {
    this.versionNumber = version;
    this.option(customFlags, "Display version number");
    return this;
  }
  example(example) {
    this.example.push(example);
    return this;
  }
  /**
   * 添加全局选项
   * @param {String} rawName 选项名称
   * @param {String} description 选项描述
   * @param {Object} config 配置项
   */
  option(rawName, description, config) {
    const option = new Option(rawName, description, config);
    this.options.push(option);
    return this;
  }
  /**
   * 将别名添加到此命令，此处的名称不能包含括号。 
   * @param {String} name 别名名称
   */
  alias(name) {
    this.aliasNames.push(name);
    return this;
  }
  /**
   * 当命令与用户输入匹配时，使用回调函数作为命令操作。
   * @param {Function} callback 回调
   */
  action(callback) {
    this.commandAction = callback;
    return this;
  }
  isMatched(name) {
    return this.name === name || this.aliasNames.includes(name);
  }
  get isDefaultCommand() {
    return this.name === "" || this.aliasNames.includes("!");
  }
  // 是否为全局命令
  get isGlobalCommand() {
    return this instanceof GlobalCommand;
  }
  // 判断是否已存在option
  hasOption(name) {
    name = name.split(".")[0];
    return this.options.find((option) => {
      return option.names.includes(name);
    });
  }
  // 输出帮助信息
  outputHelp() {
    const {name, commands} = this.cli;
    const {
      versionNumber,
      options: globalOptions,
      helpCallback
    } = this.cli.globalCommand;
    let sections = [
      {
        body: `${name}${versionNumber ? `/${versionNumber}` : ""}`
      }
    ];
    sections.push({
      title: "Usage",
      body: ` $ ${name} ${this.usageText || this.rawName}`
    });
    const showCommands = (this.isGlobalCommand || this.isDefaultCommand) && commands.length > 0;
    if (showCommands) {
      const longestCommandName = findLongest(commands.map((command) => command.rawName));
      sections.push({
        title: "Commands",
        body: commands.map((command) => {
          return `  ${padRight(command.rawName, longestCommandName.length)} ${command.description}`;
        })
      });
      sections.push({
        title: `For more info, run any command with the \`--help\` flag`,
        body: commands.map((command) => `  $ ${name}${command.name === "" ? "" : ` ${command.name}`} --help`).join("\n")
      });
    }
    const options = this.isGlobalCommand ? globalOptions : [...this.options, ...globalOptions || []];
    if (options.length > 0) {
      const longestOptionName = findLongest(options.map((option) => option.rawName));
      sections.push({
        title: "Options",
        body: options.map((option) => {
          return `  ${padRight(option.rawName, longestOptionName.length)} ${option.description} ${option.config.default === void 0 ? "" : `(default: ${option.config.default})`}`;
        }).join("\n")
      });
    }
    if (this.examples.length > 0) {
      sections.push({
        title: "Examples",
        body: this.examples.map((example) => {
          if (typeof example === "function") {
            return example(name);
          }
          return example;
        }).join("\n")
      });
    }
    // .help(callback) 
    if (helpCallback) {
      sections = helpCallback(sections) || sections;
    }
    console.log(sections.map((section) => {
      return section.title ? `${section.title} :
      ${section.body}` : section.body;
    }).join("\n\n"));
  }
  // 输出版本信息
  outputVersion() {
    const {name} = this.cli;
    const {versionNumber} = this.cli.globalCommand;
    if (versionNumber) {
      console.log(`${name}/${versionNumber} ${platformInfo}`);
    }
  }
  // 检查最小参数（至少输入几项命令）
  checkRequiredArgs() {
    const minimalArgsCount = this.args.filter((arg) => arg.required).length;
    if (this.cli.args.length < minimalArgsCount) {
      throw new CACError(`missing required args for command \`${this.rawName}\``);
    }
  }
  // 检查未知的options
  checkUnknownOptions() {
    const {options, globalCommand} = this.cli;
    // 执行command.allowUnknownOptions()时，布尔值允许此命令中存在未知选项。
    if (!this.config.allowUnknownOptions) {
      for (const name of Object.keys(options)) {
        if (name !== "--" && !this.hasOption(name) && !globalCommand.hasOption(name)) {
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
        }
      }
    }
  }
  // 检查option的值
  checkOptionValue() {
    const {options: parsedOptions, globalCommand} = this.cli;
    const options = [...globalCommand.options, ...this.options];
    for (const option of options) {
      const value = parsedOptions[option.name.split(".")[0]];
      if (option.required) {
        const hasNegated = options.some((o) => o.negated && o.names.includes(option.name));
        if (value === true || value === false && !hasNegated) {
          throw new CACError(`option \`${option.rawName}\` value is missing`);
        }
      }
    }
  }
}

class GlobalCommand extends Command {
  constructor(cli) {
    super("@@global@@", "", {}, cli);
  }
}

var __assign = Object.assign;
class CAC extends events.EventEmitter {
  constructor(name = "") {
    super();
    this.name = name;
    this.commands = [];
    this.rawArags = [];
    this.args = [];
    this.options = {};
    this.globalCommand = new GlobalCommand(this);
    this.globalCommand.usage("<command> [options]");
  }
  // 重写
  usage(text) {
    this.globalCommand.usage(text);
    return this;
  }
  /**
   * 创建命令实例
   * @param {String} rawName 命令名称
   * @param {String} description 命令描述
   * @param {Object} config 配置项
   */
  command(rawName, description, config) {
    const command = new Command(rawName, description || "", config, this);
    command.globalCommand = this.globalCommand;
    this.commands.push(command);
    return command;
  }
  // 配置option
  option(rawName, description, config) {
    this.globalCommand.options(rawName, description, config);
    return this;
  }
  /**
   * 定义帮助信息
   * @param {Function} callback 回调函数
   */
  help(callback) {
    this.globalCommand.option("-h, --help", "Display this message");
    this.globalCommand.helpCallback = callback;
    this.shwHelpOnExit = true;
    return this;
  }
  /**
   * 定义版本号
   * @param {String} version 版本号
   * @param {String} customFlags 自定义输入命令
   */
  version(version, customFlags = "-v, --version") {
    this.globalCommand.version(version, customFlags);
    // 标志程序运行时是否输出版本号
    this.showVersionOnExit = true;
    return this;
  }
  // 添加一个将显示在帮助消息末尾的示例。 
  example(example) {
    this.globalCommand.example(example);
    return this;
  }
  // 输出帮助信息
  outputHelp() {
    if (this.matchedCommand) {
      this.matchedCommand.outputHelp();
    } else {
      this.globalCommand.outputHelp();
    }
  }
  // 输出版本信息
  outputVersion() {
    this.globalCommand.outputVersion();
  }
  // 设置解析信息
  setParsedInfo({ args, options }, matchedCommand, matchedCommandName) {
    this.args = args;
    this.options = options;
    if (matchedCommand) {
      this.matchedCommand = matchedCommand;
    }
    if (matchedCommandName) {
      this.matchedCommandName = matchedCommandName;
    }
    return this;
  }
  unsetMatchedCommand() {
    this.matchedCommand = void 0;
    this.matchedCommandName = void 0;
  }
  /**
   * 全局解析
   * @param {Array} argv 命令行参数
   * @param {*} param1 额外参数
   */
  parse(argv = processArgs, {
    run = true
  } = {}) {
    // 从终端输入的命令
    this.rawArgs = argv;
    if (!this.name) {
      // 如果没有定义名称，则默认取文件名称
      this.name = argv[1] ? getFileName(argv[1]) : "cli";
    }
    let shouldParse = true;
    // 循环已配置的命令
    for (const command of this.commands) {
      const parsed = this.mri(argv.slice(2), command);
      const commandName= parsed.args[0];
      if (command.isMatched(commandName)) {
        // 已经解析过了
        shouldParse = false;
        const parsedInfo = __assign(__assign({}, parsed), {
          args: parsed.args.slice(1)
        });
        this.setParsedInfo(parsedInfo, command, commandName);
        this.emit(`command:${commandName}`, command);
      }
    }
    if (shouldParse) {
      for (const command of this.commands) {
        if (command.name === "") {
          shouldParse = false;
          const parsed = this.mri(slice(2), command);
          this.setParsedInfo(parsed, command);
          this.emit(`command:!`, command);
        }
      }
    }
    if (shouldParse) {
      const parsed = this.mri(argv.slice(2));
      this.setParsedInfo(parsed);
    }
    // 输出帮助信息
    // e.g. --help
    if (this.options.help && this.showHelpOnExit) {
      this.outputHelp();
      run = false;
      this.unsetMatchedCommand();
    }
    // 输出版本信息
    // e.g. --version
    if (this.options.version && this.showVersionOnExit) {
      this.outputVersion();
      run = false;
      this.unsetMatchedCommand();
    }
    const parsedArgv = { args: this.args, options: this.options };
    // 运行注册的命令
    if (run) {
      this.runMatchedCommand();
    }
    if (!this.matchedCommand && this.args[0]) {
      this.emit("command:*");
    }
    return parsedArgv;
  }
  mri(argv, command) {
    // 合并全局配置和当前命令配置项
    const cliOptions = [
      ...this.globalCommand.options,
      ...command ? command.options : []
    ];
    // 扫描options
    const mriOptions = getMriOptions(cliOptions);
    let argsAfterDoubleDashes = [];
    const doubleDashesIndex = argv.indexOf("--");
    if (doubleDashesIndex > -1) {
      // 截取 -- 后面的参数
      // e.g. -- help version
      argsAfterDoubleDashes = argv.slice(doubleDashesIndex + 1);
      argv = argv.slice(0, doubleDashesIndex);
    }
    let parsed = mri2(argv, mriOptions);
    // 合并parsed
    parsed = Object.keys(parsed).reduce((res, name) => {
      return __assign(__assign({}, res), {
        [camelcaseOptionName(name)] : parsed[name]
      });
    }, { _: [] });
    const args = parsed._;
    const options = {
      "--": argsAfterDoubleDashes // ['help', 'version']
    };
    // 是否忽略默认值
    const ignoreDefault = command && command.config.ignoreOptionDefaultValue ? command.config.ignoreOptionDefaultValue : this.globalCommand.config.ignoreOptionDefaultValue;
    let transforms = Object.create(null);
    for (const cliOption of cliOptions) {
      if (!ignoreDefault && cliOption.config.default !== void 0) {
        for (const name of cliOption.names) {
          options[name] = cliOption.config.default;
        }
      }
      // options的第三个参数传递了数组，数组第一项为转换函数
      // e.g. cli.option('--port <port>', `[number]  port to listen to`, [String]);
      if (Array.isArray(cliOption.config.type)) {
        transforms[cliOption.name] = Object.create(null);
        transforms[cliOption.name]["shouldTransform"] = true;
        transforms[cliOption.name]["transformFunction"] = cliOption.config.type[0];
      }
    }
    for (const key of Object.keys(parsed)) {
      if (key !== "_") {
        // e.g. help: true
        const keys = key.split(".");
        setDotProp(options, keys, parsed[key]);
        setByType(options, transforms);
      }
    }
    return {
      args,
      options
    };
  }
  // 运行匹配到的命令
  runMatchedCommand() {
    const { args, options, matchedCommand: command } = this;
    if (!command || !command.commandAction /* action添加的回调 */)
      return;
    command.checkUnknownOptions();
    command.checkOptionValue();
    command.checkRequiredArgs();
    const actionArgs = [];
    command.args.forEach((arg, index) => {
      if (arg.variadic) {
        actionArgs.push(args.slice(index));
      } else {
        actionArgs.push(args[index]);
      }
    });
    actionArgs.push(options);
    // 执行action定义的回调
    return command.commandAction.apply(this, actionArgs);
  }
}

const cac = (name = "") => new this.CAC(name);
if (typeof module !== "undefined") {
  module.exports = cac;
  Object.assign(module.exports, {
    default: cac,
    cac,
    CAC: CAC,
    Command: Command
  })
}

exports.CAC = CAC;
exports.Command = Command;
exports.cac = cac;
exports.default = cac;