# nging-format
Library for formating nginx config files
### Instalation
```
npm install nginx-format --save
```
### Usage

```javascript
const { nginxFormat } = require('nginx-format')

const fs = require('fs')
const formattedConfig = nginxFormat(fs.readFileSync('path_to_config', { encoding:  'utf8' }))

console.log(formattedConfig)
```

### Default options

```javascript
const formattedConfig = nginxFormat(configString,{
	indent: '\t',
	newLineSeparator: '\n',
	maxStatementLength: 80,
})
```
