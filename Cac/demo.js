const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务").action(function () {
  console.log("开始构建")
});
cli.option('--port <port>', `[number]  port to listen to`, { type: [String] })
cli.parse([
  'C:\\Program Files\\nodejs\\node.exe',
  'h:\\-----------------------------\\myVue\\vue3\\Cac\\demo.js',
  "serve",
  "--",
"help",
"version"]);