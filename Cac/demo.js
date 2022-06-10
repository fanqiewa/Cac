const cac_1 = require('./cac');
const cli = cac_1.cac(`vite`);
cli.command('[root]', "vite启动本地服务");
cli.option('--port <port>', `[number]  port to listen to`);
cli.help(function () { console.log("help")});
cli.parse();