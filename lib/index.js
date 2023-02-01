#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const node_fetch_1 = __importDefault(require("node-fetch"));
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cacheJson = require('../cache.json');
const PKG = require('../package.json');
commander_1.program.version(PKG.version).description('查看版本');
commander_1.program.description('请求API').action(async () => {
    const { isCache } = await inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "isCache",
            message: "是否从缓存中读取"
        },
    ]);
    if (isCache) {
        const keys = Object.keys(cacheJson);
        if (keys.length === 0) {
            console.log(chalk_1.default.red('暂无缓存'));
        }
        else {
            const res = await inquirer_1.default.prompt([
                {
                    type: "list",
                    name: "cache",
                    choices: keys,
                    message: "请选择缓存的请求"
                }
            ]);
            const value = cacheJson[res.cache];
            sendHttp(value);
        }
    }
    else {
        const result = await inquirer_1.default.prompt([
            {
                type: "list",
                name: "method",
                choices: ['GET', 'POST', 'PUT', 'HEAD', 'DELETE', 'PATCH', 'OPTIONS'],
                default: "GET"
            },
            {
                type: "list",
                name: "header",
                message: "选择请求头",
                choices: [
                    "application/x-www-form-urlencoded",
                    "application/json",
                    "multipart/form-data",
                    "text/plain"
                ]
            },
            {
                type: "input",
                name: "url",
                message: "请求资源路径",
                default: "http:// |  https://"
            },
            {
                type: "input",
                name: "params",
                message: "请输入参数(GET忽略)",
                default: ""
            },
            {
                type: "list",
                name: "response",
                message: "请选择返回格式(默认json)",
                choices: ['json', 'text', 'blob', 'buffer'],
                default: ['json']
            },
            {
                type: "confirm",
                message: "是否缓存",
                name: "cache"
            }
        ]);
        sendHttp(result);
    }
});
const cache = (params) => {
    cacheJson[params.method + '-' + params.url.substring(0, 30)] = params;
    fs_1.default.writeFileSync(path_1.default.join(__dirname, '../cache.json'), JSON.stringify(cacheJson, null, 4));
};
const sendHttp = async (result) => {
    try {
        const response = await (0, node_fetch_1.default)(result.url, {
            method: result.method,
            body: result.params || undefined,
            headers: {
                'Content-Type': result.header
            }
        });
        const val = await response[result.response]();
        if (result.cache) {
            cache(result);
        }
        console.log(chalk_1.default.green('success'));
        console.log(val);
    }
    catch (e) {
        console.log(chalk_1.default.red('error'));
        console.log(e);
    }
};
commander_1.program.command('get').description('快捷发起get请求').action(async () => {
    const { url } = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "url",
            message: "快捷请求get请输入url",
            validate(v) {
                if (!v) {
                    return 'url不能为空';
                }
                return true;
            }
        }
    ]);
    try {
        const response = await (0, node_fetch_1.default)(url).then(res => res.json());
        console.log(chalk_1.default.green('success'));
        console.log(response);
    }
    catch (e) {
        console.log(chalk_1.default.red('error'));
        console.log(e);
    }
});
commander_1.program.command('post').description('快捷发起get请求').action(async () => {
    const { url, params } = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "url",
            message: "快捷请求post请输入url",
            validate(v) {
                if (!v) {
                    return 'url不能为空';
                }
                return true;
            }
        },
        {
            type: "input",
            name: "params",
            message: "请输入参数(没有请忽略)",
            default: ""
        }
    ]);
    try {
        const response = await (0, node_fetch_1.default)(url, {
            method: "post",
            body: JSON.stringify(params) || undefined,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json());
        console.log(chalk_1.default.green('success'));
        console.log(response);
    }
    catch (e) {
        console.log(chalk_1.default.red('error'));
        console.log(e);
    }
});
commander_1.program.parse(process.argv);
