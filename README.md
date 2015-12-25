# Y.js

简单的动态Web服务器

*A simple web server by Node.js*

## 安装 Install

```
npm install y.js
```

## 使用方法 Usage

引用y.js

*Include y.js*

```
var y = require('y.js')
```

添加路由规则

*Add route rule*

```
y.add('GET', '/', function(req, res){
	// req和res为node.js的http模块的IncomingMessage和ServerResponse
	// req instanceof IncomingMessage
	// res instanceof ServerResponse
	res.send('Your content')
})
// 支持链式调用
// Chain
.get(/^\/page\/\d*$/, function(req, res){
	// url支持正则表达式
	// ...
	// 自定义返回头和代码
	// res.send(content, [header Object], [code Number])
	res.send('hello', {"content-type": "text/plain"}, 203)
})
// 静态文件
// static file
.file('/style.css', './res/style.css')
```

创建服务器

*Create server*

```
var server = y.create()
var http = require('http')
http.createServer(server).listen(8080)
```

**聚合写法**

*Combine*

```
var y = require('y.js')
var http = require('http')
http.createServer(
	y.get('/', function(req, res){
		res.send('haha')
	})
	.file('/style', './res/style.css')
	.create()
).listen(8080)
```