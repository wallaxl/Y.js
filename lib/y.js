"use strict"

var http = require("http")
var mimez = require("mimez")
var fs = require("fs")
var url = require("url")
var zlib = require("zlib")

// request route rules
var route = []

// accept request methods
const METHOD = ["GET", "POST", "HEAD", "PUT", "DELETE", "UPDATE"]

// http error
const httperr = {
	"E404": "<html><body><h1 align=center>404 - Not Found</h1><hr /></body></html>",
	"E403": "<html><body><h1 align=center>403 - Forbidden</h1><hr /></body></html>",
	"E500": "<html><body><h1 align=center>500 - Internal Server Error</h1><hr /></body></html>"
}

// match route
function match_route(req){
	if(req.method && req.url){
		for(var i = 0; i < route.length; i++){
			if(req.method != route[i].method){
				continue
			}
			
			if(typeof route[i].url == "string"){
				if(req.url != route[i].url){
					continue
				}
			}else if(route[i].url instanceof RegExp){
				if(!route[i].url.test(req.url)){
					continue
				}
			}else{
				continue
			}
			
			return route[i]
		}
		
		return false
	}else{
		return false
	}
}

// response client
function response(req, res, robj){
	var acc_cod = req.headers["accept-encoding"]
	if(acc_cod){
		if(acc_cod.indexOf("gzip")){
			robj.headers["content-encoding"] = "gzip"
			zlib.gzip(robj.content, zip_coding)
		}else if(acc_cod.indexOf("deflate")){
			robj.headers["content-encoding"] = "deflate"
			zlib.deflate(robj.content, zip_coding)
		}else{
			robj.headers["content-length"] = robj.content.length
			resp_fun_1()
		}
	}else{
		robj.headers["content-length"] = robj.content.length
		resp_fun_1()
	}
	
	function zip_coding(err, zipdata){
		if(err){
			console.log("request: " + req.url + " , code error")
			console.log(err)
		}
		
		robj.content = zipdata
		robj.headers["content-length"] = zipdata.length
		resp_fun_1()
	}
	
	function resp_fun_1(){
		
		// request range
		if(req.headers.range){
			var range_arr = req.headers.range.split("-")
			var start = range_arr[0] || 0
			var end = range_arr[1] || (robj.content.length - 1)
			
			robj.code = 206
			robj.headers["content-range"] = start + "-" + end + "/" + robj.content.length
			robj.content = robj.content.slice(start, end)
		}
		res.writeHead(robj.code, robj.headers)
		res.end(robj.content)
	}
}

function sendFile(req, res, filepath){
	fs.exists(filepath, function(e){
		if(e){
			fs.stat(filepath, function(err, stat){
				if(err){
					// 403
					response(req, res, {
						"code": 403,
						"headers": {
							"content-type": "text/html"
						},
						"content": httperr.E403
					})
				}else{
					if(stat.isFile()){
						fs.readFile(filepath, function(err, fdata){
							if(err){
								
								// 500
								response(req, res, {
									"code": 500,
									"headers": {
										"content-type": "text/html"
									},
									"content": httperr.E500
								})
							}else{
								response(req, res, {
									"code": 200,
									"headers": {
										"content-type": mimez.path(filepath)
									},
									"content": fdata
								})
							}
						})
					}else{
						
						// 403
						response(req, res, {
							"code": 403,
							"headers": {
								"content-type": "text/html"
							},
							"content": httperr.E403
						})
					}
				}
			})
		}else{
			
			// file not exists
			// 404
			response(req, res, {
				"code": 404,
				"headers": {
					"content-type": "text/html"
				},
				"content": httperr.E404
			})
		}
	})
}

module.exports = {
	add: function(method, url, callback){
		if(typeof method != "string"){
			return false
		}
		
		if(METHOD.indexOf(method) == -1){
			return false
		}
		
		if(typeof url != "string" && !(url instanceof RegExp)){
			return false
		}
		
		if(typeof callback != "function"){
			return false
		}
		
		route.push({"method": method, "url": url, "callback": callback})
		return this
	},
	
	get: function(url, callback){
		return this.add("GET", url, callback)
	},
	
	post: function(url, callback){
		return this.add("POST", url, callback)
	},
	
	// this is request a static resource,
	// so the callback emit after response
	static: function(url, file, callback){
		if(typeof url != "string"){
			return false
		}
		
		if(typeof file != "string"){
			return false
		}
		
		if(callback){
			if(typeof callback == "function"){
				route.push({"method": "GET", "url": url, "file": file, "callback": callback})
			}else{
				route.push({"method": "GET", "url": url, "file": file})
			}
		}else{
			route.push({"method": "GET", "url": url, "file": file})
		}
		
		return this
	},
	
	Y: function(req, res){
		if(req && res){
			var rt_info = match_route(req)
			
			if(rt_info){
				if(rt_info.file){
					
					// static file request
					sendFile(req, res, rt_info.file)
					if(rt_info.callback){
						rt_info.callback(req)
					}
				}else{
					
					// dynanic request
					
					// init pre-response information
					res.resp_code = 200
					res.resp_headers = {"content-type": "text/html"}
					
					res.send = function(res_data){
						response(req, res, {
							"code": this.resp_code,
							"headers": this.resp_headers,
							"content": res_data
						})
					}
					
					rt_info.callback(req, res)
				}
			}else{
				
				// 404
				response(req, res, {
					"code": 404,
					"headers": {
						"content-type": "text/html"
					},
					"content": httperr.E404
				})
			}
		}else{
			return false
		}
	}
}