CAC是一个用于构建CLI应用程序的JavaScript库。在Vite构建工具中使用到。

### 一、 CAC的常用API

* 1、`.cac(name?)`

创建CLI实例，可以选择指定将用于在帮助和版本消息中显示的程序名。未设置时，我们使用argv[1]的basename。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
```

* 2、`.command(name, description, config?)`

创建命令实例。该选项还接受第三个参数config作为附加命令config：
`config.allowUnknownOptions`: 布尔值允许此命令中存在未知选项。
`config.ignoreOptionDefaultValue`: 在解析的选项中不使用选项的默认值，只在帮助消息中显示它们。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务");
```

* 3、`.option(name, description, config?)`

添加全局选项。该选项还接受第三个参数config作为附加命令config：
`config.default`: 选项的默认值。
`config.type`: any[]设置为[]时，选项值返回数组类型。您还可以使用转换函数，例如[String]，它将使用String调用选项值。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.option('--port <port>', `[number]  port to listen to`, { type: [String] });
```

* 4、`command.action(callback)`

当命令与用户输入匹配时，使用回调函数作为命令操作。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务").action(function() {
  console.log("serve")
});
cli.parse();
```

* 5、`.parse(argv?)`

全局解析。调用此方法时，`cli.rawArgs`、` cli.args`、` cli.options`、` cli.matched`命令也将可用。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务");
cli.option('--port <port>', `[number]  port to listen to`);
cli.help();
cli.version("1.0.1");
cli.parse();
```

**命令行执行**
```shell
$ node index.js -v
```

* 6、`.version(version, customFlags?)`

定义版本号。当命令行输入`-v`或`--version`时，输出版本号。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.version("1.0.1");
```

* 7、`.help(callback?)`

定义帮助信息。当命令行输入`-h`或`--help`时，输出帮助信息。可选回调允许在显示帮助文本之前对其进行后处理。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.help(function () { });
```

* 8、`.outputHelp()`

输出帮助信息。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务");
cli.option('--port <port>', `[number]  port to listen to`);
cli.help();
cli.outputHelp();
```

* 9、`.outputVersion()`

输出版本信息。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务");
cli.option('--port <port>', `[number]  port to listen to`);
cli.version("1.0.1");
cli.outputVersion();
```

* 10、`.usage(text)`

添加全局用法文本。子命令不使用此选项。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.usage("usage");
```

* 11、`.example(example)`

添加一个将显示在帮助消息末尾的示例。 

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务");
cli.example("npm run serve");
cli.outputHelp();
```

* 12、`command.alias(name)`

将别名添加到此命令，此处的名称不能包含括号。 

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务").alias("serve");
```

* 13、`command.allowUnknownOptions()`

允许此命令中的未知选项，默认情况下，当使用未知选项时，CAC将记录错误。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务").allowUnknownOptions();
```

* 14、`command.ignoreOptionDefaultValue()`

在解析的选项中不使用选项的默认值，只在帮助消息中显示它们。

**example**

```javascript
const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务").ignoreOptionDefaultValue();
```

### 二、一个完整的例子

```javascript

// 解析命令行参数
const cac_1 = require("cac");

// 指定名称
const cli = cac_1.cac(`vite`);


// 全局options
cli
  .option('--config <file>, -c <file>', `[string]  use specified config file`)
  .option('--debug [feat]', `[string | boolean]  show debug logs`)
  .option('--mode <mode>, -m <mode>', `[string]  specify env mode (default: 'development' for dev, 'production' for build)`)
  .option('--jsx <preset>', `['vue' | 'preact' | 'react']  choose jsx preset (default: 'vue')`)
  .option('--jsx-factory <string>', `[string]  (default: React.creatElement)`)
  .option('--jsx-fragment <string>', `[string]  (default: React.Fragment)`);

// 服务配置 serve
cli
  .command('[root]') // 默认名 e.g. npm run dev   package.json -> script -> dev: 'vite dev'
  .alias('serve') // 别名为serve e.g. npm run serve
  .option('--port <port>', `[number] port to listen to`)
  .option('--force', `[boolean]  force the optimizer to ignore the cache and re-bundle`)
  .option('--https', `[boolean]  start the server with TLS and HTTP/2 enabled`)
  .option('--open', `[boolean]  open browser on server start`)
  .action(async (root, argv) => {
    if (root) {
      argv.root = root;
    }
    const options = await resolveOptions({ arg, defaultMode: 'development' /* serve 时默认 'development' */});
    return runServe(options);
  });

// 打包配置 build
cli
  .command('build [root]')
  .option('--entry <file>', `[string]  entry file for build (default: index.html)`)
  .option('--base <path>', `[string]  public base path (default: /)`)
  .option('--outDir <dir>', `[string]  output directory (default: dist)`)
  .option('--assetsDir <dir>', `[string]  directory under outDir to place assets in (default: _assets)`)
  .option('--assetsInlineLimit <number>', `[number]  static asset base64 inline threshold in bytes (default: 4096)`)
  .option('--ssr', `[boolean]  build for server-side rendering`)
  .option('--sourcemap', `[boolean]  output source maps for build (default: false)`)
  .option('--minify [minifier]', `[boolean | 'terser' | 'esbuild']  enable/disable minification, or specify minifier to use (default: terser)`)
  .action(async (root, argv) => {
    if (root) {
        argv.root = root;
    }
    const options = await resolveOptions({ argv, defaultMode: 'production' /* serve 时默认 'production' */});
    return runBuild(options);
  });

// 最优化 optimize
cli
  .command('optimize [root]')
  .option('--force', `[boolean]  force the optimizer to ignore the cache and re-bundle`)
  .action(async (root, argv) => {
    if (root) {
      argv.root = root;
    }
    const options = await resolveOptions({ argv, defaultMode: 'development' });
    return runOptimize(options);
  });
  cli.help();
  cli.version(require('../../package.json').version);
  cli.parse();
```

