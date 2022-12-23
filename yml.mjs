import fs from 'fs'
import YAML from 'yaml'
import https from 'https'

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

const srcLng = 'zh-cn'
const targetLngArray = ['zh-TW']
const file = fs.readFileSync('./zh-cn.yml', 'utf8')

const src = YAML.parseDocument(file)
targetLngArray.forEach(async targetLng => {
    const target = src.clone()

    for (let i = 0; i < target.contents.items.length; i++) {
        const element = target.contents.items[i];
        const result = await translate(srcLng, targetLng, element.value.value)
        target.set(element.key.value, result)
    }

    console.log(YAML.stringify(target))
    fs.writeFile(`./${targetLng}.yml`, YAML.stringify(target), err => {
        if (err) {
            console.error(err)
            return
        }
    })
})
