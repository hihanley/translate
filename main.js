const https = require('https')
const fs = require('fs')

function translate(srcLng, targetLng, text) {
    return new Promise((resolve) => {
        https
            .get(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${srcLng}&tl=${targetLng}&q=${text}`, (response) => {
                let result = '';
                response.on('data', (chunk) => {
                    result += chunk;
                });
                response.on('end', () => {
                    const target = JSON.parse(result)[0]
                    console.log(`Success: ${text} => ${target}`)
                    resolve(target)
                });
            })
            .on("error", (error) => {
                console.log("Error: " + error.message)
                resolve("需要手动翻译：" + text)
            });
    });
}

function write2File(filePath, data) {
    fs.writeFile(filePath, JSON.stringify(data), err => {
        if (err) {
            console.error(err)
            return
        }
    })
}

async function tryTranslate(key, value, result, srcLng, targetLng) {
    if (typeof value === 'object') {
        result[key] = {}
        const keys = Object.keys(value)
        for (let i = 0; i < keys.length; i++) {
            const _key = keys[i];
            const _value = value[_key]
            await tryTranslate(_key, _value, result[key], srcLng, targetLng)
        }
    } else {
        const lines = value.split('\n')
        let targetLines = []
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            targetLines[i] = await translate(srcLng, targetLng, line)
        }
        result[key] = targetLines.join('\\n')
    }
}

const srcLng = 'zh'
const targetLngs = ['en']
const srcFileName = 'zh.js'
const srcPath = './'

async function main() {
    const srcFile = require(srcPath + srcFileName)
    for (const targetLng of targetLngs) {
        let result = {}

        const keys = Object.keys(srcFile)
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = srcFile[key]
            await tryTranslate(key, value, result, srcLng, targetLng)
        }
        write2File(`${srcPath}${targetLng}.json`, result)
    }
}

main()