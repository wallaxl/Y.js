"use strict"

var fs = require("fs")
var http = require("http")
var zlib = require("zlib")
var parseUrl = require("url").parse

var specRecv = {
	_404: "<html><body><p style=font-size:22px>404 Not Found</p><hr></body></html>",
	_403: "<html><body><p style=font-size:22px>403 Forbidden</p><hr></body></html>",
	_500: "<html><body><p style=font-size:22px>500 Internal Server Error</p><hr></body></html>"
}

function Y(host){
	var list = []
	this.host = host
	this._add = function(method, url, cb, file){
		list.push({"method": method, "url": url, "callback": cb, "file": file})
	}
	
	var server = http.createServer(function(q, s){
		if(!host || q.headers.host == host || q.headers.host == "localhost" || q.headers.host == "127.0.0.1"){
			var url = parseUrl(q.url)
			var res = function(code, header, text){
				var encodings = q.headers["accept-encoding"].split(", ")
				var sendEnc = function(result){
					if(q.headers["Range"]){
						var range = q.headers["Range"]
						var start = 0
						var end = result.length - 1
						
						if(/\d*-$/i.test(range)){
							start = parseInt(range.match(/(\d*)-$/i)[1])
						}
						
						else if(/^-\d*?$/i.test(range)){
							end = parseInt(range.match(/^-(\d*?)$/i)[1])
						}
						
						else if(/^\d*-\d*$/i.test(range)){
							start = parseInt(range.match(/^(\d*)-(\d*)$/i)[1])
							end = parseInt(range.match(/^(\d*)-(\d*)$/i)[2])
						}
						
						if(start > 0 && start < result.length && start < end && 
								end < result.length){
							var newresult = result.slice(start, end)
							header["content-range"] = start + "-" + end + "/" + 
									newresult.length
							s.writeHead(code, header)
							s.end(newresult)
						}
					}else{
						s.writeHead(code, header)
						s.end(result)
					}
				}
				
				if(encodings[0] === "gzip"){
					zlib.gzip(new Buffer(text), function(err, result){
						if(err) throw err
						header["content-encoding"] = "gzip"
						header["content-length"] = result.length
						sendEnc(result)
					})
				}else if(encodings[0] === "deflate"){
					zlib.deflate(new Buffer(text), function(err, result){
						if(err) throw err
						header["content-encoding"] = "deflate"
						header["content-length"] = result.length
						sendEnc(result)
					})
				}else{
					var result = new Buffer(text)
					header["content-length"] = result.length
					sendEnc(result)
				}
			}
			
			s.resp = res
			
			for(var i=0;i<list.length;i++){
				try{
					if(typeof list[i].url == "string"){
						if(url.path === list[i].url && q.method === list[i].method){
							if(typeof list[i].file == "string"){
								fs.readFile(list[i].file, function(err, data){
									if(err) throw err
									var ext = list[i].file.match(/.*\.(.*?)$/i)[1]
									res(200, {"content-type": mime(ext)}, data)
									
									if(typeof list[i].callback == "function") list[i].callback(q, s)
								})
							}else{
								if(typeof list[i].callback == "function") list[i].callback(q, s)
							}
							return
						}
					}else if(list[i].url instanceof RegExp){
						if(list[i].url.test(url.path) && list[i].method === q.method){
							if(typeof list[i].callback == "function") list[i].callback(q, s)
							return
						}
					}
				}catch(e){
					res(500, {"content-type": "text/html"}, specRecv._500)
				}
			}
			
			res(404, {"content-type": "text/html"}, specRecv._404)
		}
	})
	
	this._listen = function(p){
		server.listen(p)
	}
}
Y.prototype = {
	listen: function(port){
		this._listen(port || 80)
	},
	add: function(url, method, cb){
		this._add(method, url, cb)
		return this
	},
	get: function(url, cb){
		this._add("GET", url, cb)
		return this
	},
	post: function(url, cb){
		this._add("POST", url, cb)
		return this
	},
	file: function(url, path, cb){
		this._add("GET", url, cb, path)
		return this
	}
}

function mime(ext){
    return {
    "acx": "application/internet-property-stream",
    "ai": "application/postscript",
    "aif": "audio/x-aiff",
    "aifc": "audio/x-aiff",
    "aiff": "audio/x-aiff",
    "asf": "video/x-ms-asf",
    "asr": "video/x-ms-asf",
    "asx": "video/x-ms-asf",
    "au": "audio/basic",
    "avi": "video/x-msvideo",
    "axs": "application/olescript",
    "bas": "text/plain",
    "bcpio": "application/x-bcpio",
    "bin": "application/octet-stream",
    "bmp": "image/bmp",
    "c": "text/plain",
    "cat": "application/vnd.ms-pkiseccat",
    "cdf": "application/x-cdf",
    "cer": "application/x-x509-ca-cert",
    "class": "application/octet-stream",
    "clp": "application/x-msclip",
    "cmx": "image/x-cmx",
    "cod": "image/cis-cod",
    "cpio": "application/x-cpio",
    "crd": "application/x-mscardfile",
    "crl": "application/pkix-crl",
    "crt": "application/x-x509-ca-cert",
    "csh": "application/x-csh",
    "css": "text/css",
    "dcr": "application/x-director",
    "der": "application/x-x509-ca-cert",
    "dir": "application/x-director",
    "dll": "application/x-msdownload",
    "dms": "application/octet-stream",
    "doc": "application/msword",
    "dot": "application/msword",
    "dvi": "application/x-dvi",
    "dxr": "application/x-director",
    "eps": "application/postscript",
    "etx": "text/x-setext",
    "evy": "application/envoy",
    "exe": "application/octet-stream",
    "fif": "application/fractals",
    "flr": "x-world/x-vrml",
    "gif": "image/gif",
    "gtar": "application/x-gtar",
    "gz": "application/x-gzip",
    "h": "text/plain",
    "hdf": "application/x-hdf",
    "hlp": "application/winhlp",
    "hqx": "application/mac-binhex40",
    "hta": "application/hta",
    "htc": "text/x-component",
    "htm": "text/html",
    "html": "text/html",
    "htt": "text/webviewhtml",
    "ico": "image/x-icon",
    "ief": "image/ief",
    "iii": "application/x-iphone",
    "ins": "application/x-internet-signup",
    "isp": "application/x-internet-signup",
    "jfif": "image/pipeg",
    "jpe": "image/jpeg",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "application/x-javascript",
    "latex": "application/x-latex",
    "lha": "application/octet-stream",
    "lsf": "video/x-la-asf",
    "lsx": "video/x-la-asf",
    "lzh": "application/octet-stream",
    "m13": "application/x-msmediaview",
    "m14": "application/x-msmediaview",
    "m3u": "audio/x-mpegurl",
    "man": "application/x-troff-man",
    "mdb": "application/x-msaccess",
    "me": "application/x-troff-me",
    "mht": "message/rfc822",
    "mhtml": "message/rfc822",
    "mid": "audio/mid",
    "mny": "application/x-msmoney",
    "mov": "video/quicktime",
    "movie": "video/x-sgi-movie",
    "mp2": "video/mpeg",
    "mp3": "audio/mpeg",
    "mpa": "video/mpeg",
    "mpe": "video/mpeg",
    "mpeg": "video/mpeg",
    "mpg": "video/mpeg",
    "mpp": "application/vnd.ms-project",
    "mpv2": "video/mpeg",
    "ms": "application/x-troff-ms",
    "mvb": "application/x-msmediaview",
    "nws": "message/rfc822",
    "oda": "application/oda",
    "p10": "application/pkcs10",
    "p12": "application/x-pkcs12",
    "p7b": "application/x-pkcs7-certificates",
    "p7c": "application/x-pkcs7-mime",
    "p7m": "application/x-pkcs7-mime",
    "p7r": "application/x-pkcs7-certreqresp",
    "p7s": "application/x-pkcs7-signature",
    "pbm": "image/x-portable-bitmap",
    "pdf": "application/pdf",
    "pfx": "application/x-pkcs12",
    "pgm": "image/x-portable-graymap",
    "pko": "application/ynd.ms-pkipko",
    "pma": "application/x-perfmon",
    "pmc": "application/x-perfmon",
    "pml": "application/x-perfmon",
    "pmr": "application/x-perfmon",
    "pmw": "application/x-perfmon",
    "pnm": "image/x-portable-anymap",
    "pot,": "application/vnd.ms-powerpoint",
    "ppm": "image/x-portable-pixmap",
    "pps": "application/vnd.ms-powerpoint",
    "ppt": "application/vnd.ms-powerpoint",
    "prf": "application/pics-rules",
    "ps": "application/postscript",
    "pub": "application/x-mspublisher",
    "qt": "video/quicktime",
    "ra": "audio/x-pn-realaudio",
    "ram": "audio/x-pn-realaudio",
    "ras": "image/x-cmu-raster",
    "rgb": "image/x-rgb",
    "rmi": "audio/mid",
    "roff": "application/x-troff",
    "rtf": "application/rtf",
    "rtx": "text/richtext",
    "scd": "application/x-msschedule",
    "sct": "text/scriptlet",
    "setpay": "application/set-payment-initiation",
    "setreg": "application/set-registration-initiation",
    "sh": "application/x-sh",
    "shar": "application/x-shar",
    "sit": "application/x-stuffit",
    "snd": "audio/basic",
    "spc": "application/x-pkcs7-certificates",
    "spl": "application/futuresplash",
    "src": "application/x-wais-source",
    "sst": "application/vnd.ms-pkicertstore",
    "stl": "application/vnd.ms-pkistl",
    "stm": "text/html",
    "svg": "image/svg+xml",
    "sv4cpio": "application/x-sv4cpio",
    "sv4crc": "application/x-sv4crc",
    "swf": "application/x-shockwave-flash",
    "t": "application/x-troff",
    "tar": "application/x-tar",
    "tcl": "application/x-tcl",
    "tex": "application/x-tex",
    "texi": "application/x-texinfo",
    "texinfo": "application/x-texinfo",
    "tgz": "application/x-compressed",
    "tif": "image/tiff",
    "tiff": "image/tiff",
    "tr": "application/x-troff",
    "trm": "application/x-msterminal",
    "tsv": "text/tab-separated-values",
    "txt": "text/plain",
    "uls": "text/iuls",
    "ustar": "application/x-ustar",
    "vcf": "text/x-vcard",
    "vrml": "x-world/x-vrml",
    "wav": "audio/x-wav",
    "wcm": "application/vnd.ms-works",
    "wdb": "application/vnd.ms-works",
    "wks": "application/vnd.ms-works",
    "wmf": "application/x-msmetafile",
    "wps": "application/vnd.ms-works",
    "wri": "application/x-mswrite",
    "wrl": "x-world/x-vrml",
    "wrz": "x-world/x-vrml",
    "xaf": "x-world/x-vrml",
    "xbm": "image/x-xbitmap",
    "xla": "application/vnd.ms-excel",
    "xlc": "application/vnd.ms-excel",
    "xlm": "application/vnd.ms-excel",
    "xls": "application/vnd.ms-excel",
    "xlt": "application/vnd.ms-excel",
    "xlw": "application/vnd.ms-excel",
    "xof": "x-world/x-vrml",
    "xpm": "image/x-xpixmap",
    "xwd": "image/x-xwindowdump",
    "z": "application/x-compress",
    "zip": "application/zip"}[ext]
}


//mime
module.exports.htm = mime("htm")
module.exports.html = mime("htm")
module.exports.css = mime("css")
module.exports.js = mime("js")
module.exports.svg = mime("svg")
module.exports.jpg = mime("jpg")
module.exports.png = mime("png")
module.exports.gif = mime("gif")

module.exports.mime = mime
module.exports.create = function(hostname){
	return new Y(hostname)
}
module.exports.err = specRecv