#!/usr/bin/env node
import { program } from 'commander'
import http from 'node-fetch'
import inquirer from 'inquirer'
import { Result } from './type'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import ws from 'ws'
const cacheJson = require('../cache.json')
const PKG = require('../package.json')


program.version(PKG.version).description('查看版本')



program.description('请求API').action(async () => {

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
                default: "",
                message: "请输入token（GET请忽略）",
                name: "token"
            },
            {
                type: "input",
                name: "params",
                message: "请输入参数(GET忽略)",
                default: " "
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
                'Content-Type': result.header,
                 Authorization: result.token ?? ""
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





program.command('get').description('快捷发起get请求').action(async () => {
    const { url } = await inquirer.prompt<{ url: string }>([
        {
            type: "input",
            name: "url",
            message: "快捷请求get请输入url",
            validate(v) {
                if (!v) {
                    return 'url不能为空'
                }
                return true
            }
        }
    ])
    try {
        const response = await http(url).then(res => res.json())
        console.log(chalk.green('success'))
        console.log(response)
    }
    catch (e) {
        console.log(chalk.red('error'))
        console.log(e)
    }
})


program.command('post').description('快捷发起post请求').action(async () => {
    const { url, params } = await inquirer.prompt<{ url: string, params: string }>([
        {
            type: "input",
            name: "url",
            message: "快捷请求post请输入url",
            validate(v) {
                if (!v) {
                    return 'url不能为空'
                }
                return true
            }
        },
        {
            type: "input",
            name: "params",
            message: "请输入参数(没有请忽略)",
            default: ""
        }
    ])
    try {
        const response = await http(url, {
            method: "post",
            body: JSON.stringify(params) || undefined,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
        console.log(chalk.green('success'))
        console.log(response)
    }
    catch (e) {
        console.log(chalk.red('error'))
        console.log(e)
    }
})



program.command('ws').description('socket套接字测试').action(async () => {

    const { url } = await inquirer.prompt<{ url: string }>({
        type: "input",
        message: "请输入ws | wss 协议地址",
        name: "url"
    })

    const socket = new ws(url)

    socket.on('open', () => {
        console.log('socket 已连接')
    })

    socket.on('message', (e) => {
        console.log('result:' + e.toString())
    })

    socket.on('error', (e) => {
        console.log('error', e)
    })

    socket.on('close', () => {
        console.log('socket 已断开')
    })
})


program.command('del').description('删除缓存').action(async () => {
    const keys = Object.keys(cacheJson)
    if (keys.length === 0) {
        return console.log(chalk.red('当前无缓存可以删除'))
    }

    try {
        const { name } = await inquirer.prompt<{ name: string }>({
            type: "list",
            choices: keys,
            name: "name",
            message: "请选择删除的缓存"
        })

        delete cacheJson[name]
        fs.writeFileSync(path.join(__dirname, '../cache.json'), JSON.stringify(cacheJson, null, 4))
        console.log(chalk.green('success'))

    }

    catch (e) {
        console.log(chalk.red('error'))
        console.log(e)
    }


})

program.parse(process.argv)