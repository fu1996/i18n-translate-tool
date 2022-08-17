#!/usr/bin/env node

const { program } = require('commander');


program
    .version('1.0.0')
    .option('--file [file] [lang]', '导入待翻译的文件以及目标语言')
    .option('--dist [file]', '输出翻译后的结果，默认会覆盖源文件')


program.parse();