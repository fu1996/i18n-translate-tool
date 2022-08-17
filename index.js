#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const {translateArray} = require('./translate');
const template = require('./template');

program
    .version('1.0.0')
    .option('-f, --file [file]', '导入待翻译的文件以及目标语言')
    .option('-d, --dist [file]', '输出翻译后的结果，默认会覆盖源文件')
    .option('-p, --param [translate key]', '取被翻译文件对象的 keys 或者 values', 'keys')

program.parse();

const options = program.opts();

const {file, param, dist = ''} = options;
console.log('获取到的配置如下：', options);

const workingDir = process.cwd();

const targetFile = path.join(workingDir, file);
const distFile = path.join(workingDir, dist === '' ? file : dist);

import(targetFile).then(async res => {
    const finalObj = {};
    const moduleKeys = Object.keys(res).reverse();
    console.log(`被翻译的文件${file} ESM暴露的变量如下`, moduleKeys);
    if (param === 'values') {
        const targetValue = moduleKeys.map(item => {
            const currentValue = res[item];
            const translateValue = Object[param](currentValue);
                console.log('currentValue', item, currentValue, translateValue);
        })
    } else {
        for (let index = 0; index < moduleKeys.length; index++) {
            const moduleName = moduleKeys[index];
            const currentValue = res[moduleName];
            const translateValue = Object[param](currentValue);
            const englishRes = await translateArray(translateValue)
            const resultObj = translateValue.reduce((prev, curr, index) => {
                prev[curr] = englishRes[index]
                return prev;
            }, {})
            finalObj[moduleName]  = resultObj;
            // 遍历结束了
            if (index === moduleKeys.length -1) {
                let str = '';
                for (const item in finalObj) {
                    if (item === 'default') {
                       str += template.getDefaultTemplate(finalObj[item])
                    } else {
                        str += template.getVarTemplate(finalObj[item], item)
                    }
                    str += '\n'.repeat(2);    
                }
                console.log('翻译完毕，内容如下，请检查', str);
                console.log('即将写入文件', distFile);
                const isExistFile = fs.existsSync(distFile);
                // 目标文件已经存在 并且不覆盖源文件文件
                if (isExistFile && dist !== '') {
                      const result = await inquirer.prompt({
                        type: 'confirm',
                        name: 'confirm',
                        default: true,
                        message: `目标文件${dist}已经存在，是否覆盖(y: 覆盖, n: 追加)`
                      });
                      if(result.confirm) {
                        fs.writeFileSync(distFile, str, 'utf8');
                      } else {
                        try {
                            fs.appendFileSync(distFile, str);
                        } catch (error) {
                            console.error(error);
                        }
                      }
                } else {
                    fs.writeFileSync(distFile, str, 'utf8');
                }
            }
        }
    }
})
