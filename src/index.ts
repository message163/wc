#!/usr/bin/env node
import { program } from 'commander'
import http from 'node-fetch'
import inquirer from 'inquirer'
import { Result } from './type'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
const cacheJson = require('../cache.json')
const PKG = require('../package.json')


program.version(PKG.version).description('查看版本')



program.action(async () => {

    const { isCache } = await inquirer.prompt([
        {
            type: "confirm",
            name: "isCache",
            message: "是否从缓存中读取"
        },
    ])

    if (isCache) {
        const keys = Object.keys(cacheJson)
        if (keys.length === 0) {
            console.log(chalk.red('暂无缓存'))
        } else {
            const res = await inquirer.prompt([
                {
                    type: "list",
                    name: "cache",
                    choices: keys,
                    message: "请选择缓存的请求"
                }
            ])

            const value = cacheJson[res.cache];
            sendHttp(value)

        }
    } else {
        const result = await inquirer.prompt<Result>([

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
        ])
        sendHttp(result)
    }
})


const cache = <T extends Result>(params: T) => {
    cacheJson[params.method + '-' + params.url.substring(0, 30)] = params;
    fs.writeFileSync(path.join(__dirname, '../cache.json'), JSON.stringify(cacheJson, null, 4))
}

const sendHttp = async <T extends Result>(result: T) => {
    try {
        const response = await http(result.url, {
            method: result.method,
            body: result.params || undefined,
            headers: {
                'Content-Type': result.header
            }
        })
        const val = await response[result.response]()

        if (result.cache) {
            cache(result)
        }
        console.log(chalk.green('success'))
        console.log(val)
    }
    catch (e) {
        console.log(chalk.red('error'))
        console.log(e)
    }
}

program.parse(process.argv)