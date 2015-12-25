"use strict"

var Yjs = require("./lib/y.js")

module.exports = {
	create: function(){
		return Yjs.Y
	},
	
	add: Yjs.add,
	
	get: Yjs.get,
	
	post: Yjs.post,
	
	file: Yjs.static
}