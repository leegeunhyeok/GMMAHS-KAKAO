"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app/app.js");
const app = new app_js_1.default();
app.init(8080).then(() => {
    app.start();
});
