var sysPath = require('path');
var fs = require('fs');

module.exports = (function() {
	// Global  variables
	var mime;
	// Possible Maximum value for the verbose
	const MAX_VERBOSE_VAL = 4;
	// Pattern to find pattern like url(\'../assets/images/clock.svg\') 
	const pattern = /url(?:\s*)\(\/?([^\)]*)\)/g;
	// Plugin config with defalt values
	var opts = {
		// show all verbose levels 
		//	0=No verbose(default), 
		//	1=Only skipped images greater than max size, 
		// 	2=Only HTTP/HTTPS images, 
		// 	3=Only converted,
		//	4=All
		verbose: 0,
		altImageDir: '.',
		hideErrors:false,
		maxSizeLimitInKb: 32,
		// Controls keeping quoting inside `url()`, incase of svg it will always keep quotes
		urlQuotes: false
	} 

	// Map to store image data-uri's data 
	var imagesDataMap = [];
	var imgsExtns = ['.svg','.jpeg','.jpg','.png'];

	// these static methods are used as a fallback when the optional 'mime' dependency is missing
	var _mime = {
		// this map is intentionally incomplete
		// if you want more, install 'mime' dep
		_types: {
			'.htm' : 'text/html',
			'.html': 'text/html',
			'.gif' : 'image/gif',
			'.jpg' : 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png' : 'image/png',
			'.svg' : 'image/svg+xml',
		},
		lookup: function (filepath) {
			var ext = sysPath.extname(filepath),
			type = _mime._types[ext];
			if (type === undefined) {
				throw new Error('Optional dependency "mime" is required for ' + ext);
			}
			return type;
		},
		charsets: {
			lookup: function (type) {
				// assumes all text types are UTF-8
				return type && (/^text\//).test(type) ? 'UTF-8' : '';
			}
		}
	};

	// Loading MIME lib
	try {
		mime = require('mime');
	} catch (ex) {
		mime = _mime;
	}

	// Clean the url values after extract from data
	function clean_url_value(str){
		str = str.trim();
		str = str.replace(/^'/, '');
		str = str.replace(/'$/, '');
		str = str.replace(/^"/, '');
		str = str.replace(/"$/, '');
		str = str.trim();
		return str;
	}

	// Convert images to base64 if less than specific size.
	function getDataUri(mimetype, filePath) {
		var useBase64 = false;
		var ext = sysPath.extname(filePath);

		// use base 64 unless it's an ASCII or UTF-8 format
		var charset = mime.charsets.lookup(mimetype);

		if(ext == '.svg'){
			mimetype += ';charset=UTF-8';
		} else {
			useBase64 = ['US-ASCII', 'UTF-8'].indexOf(charset) < 0;
		}
		
		if (useBase64) { mimetype += ';base64'; }
		try{
			var buf = fs.readFileSync(filePath);
		} catch(er){
			if(!opts.hideErrors){
				console.warn('File not found: %s',filePath);
			}
			imagesDataMap[filePath].toSkipped = true;
			return filePath;
		}

		// IE8 cannot handle a data-uri larger than 32KB. If this is exceeded
		// and the --ieCompat flag is enabled, return a normal url() instead.
		var DATA_URI_MAX_KB = opts.maxSizeLimitInKb || 32,
		fileSizeInKB = parseInt((buf.length / 1024), 10);

		if (fileSizeInKB >= DATA_URI_MAX_KB) {
			if(opts.verbose == 1 || opts.verbose == MAX_VERBOSE_VAL) {
				console.info("Skipped data-uri embedding of %s because its size (%dKB) exceeds IE8-safe %dKB!", filePath, fileSizeInKB, DATA_URI_MAX_KB);
			}
			if(typeof imagesDataMap[filePath] !== 'undefined'){
				imagesDataMap[filePath].toSkipped = true;
			}
			return filePath;
		}

		buf = useBase64 ? buf.toString('base64') : encodeURIComponent(buf);

		var uri = 'data:' + mimetype + ',' + buf;
		return uri;
	}

	// Modify the arg data inorder to make image data to base64.
	function parseImageUrls(params){
		if(opts.verbose !== 0 || !opts.hideErrors){
			console.info('[Embedding data URIs to] -> %s', params.path);
		}
		var fileAbsPath =  sysPath.resolve(sysPath.dirname(params.path));
		var data = params.data;
		var result = data.match(pattern); 
		var base64Data = data;

		result.forEach(function(item){
			// Assuming image path is system path, not "http/https path"
			var raw_path = item.replace(/url(?:\s*)\((?:\s*)[\'\"]?([^\)\'\"]*)[\'\"]?(?:\s*)\)/, '$1');
			var path = clean_url_value(raw_path); // '../assets/images/clock.svg'
			var ext = sysPath.extname(path);
			// Don't convert when path is already a data-uri  
			if(/^data:image/.test(path) || (imgsExtns.indexOf(ext) == -1)){
				return;
			}

			if(/^(http|https):\/\//.test(path)){
				if(opts.verbose == 2 || opts.verbose == MAX_VERBOSE_VAL){
					console.info('Skipped data-uri as path has http/https %s', path);
				} 
				return;
			}

			// Find absolute path in relation to the "*.less" file path 
			var absPath = sysPath.resolve(fileAbsPath, path); 

			if(!fs.existsSync(absPath)){
				var newpath = sysPath.resolve(opts.altImageDir, path);
				if(fs.existsSync(newpath)){
					absPath = newpath;
				}else{
					if(!opts.hideErrors){
						console.info('[Warn] Skipped, the file is missing at: %s',absPath);
					}
					return;
				}
			}

			if(typeof imagesDataMap[absPath] === 'undefined'){
				var mimeType = mime.lookup(path);

				imagesDataMap[absPath] = {};
				imagesDataMap[absPath].path = path;
				imagesDataMap[absPath].absPath = absPath;
				imagesDataMap[absPath].mimeType = mimeType;
				imagesDataMap[absPath].toSkipped = false; // Also upadted in getDataUri()
				imagesDataMap[absPath].dataUri = getDataUri(mimeType, absPath);
			}
			// Don't replace url with base64 when it is marked to skipped.
			if(!imagesDataMap[absPath].toSkipped){
				var quote = ('image/svg+xml' === imagesDataMap[absPath].mimeType || opts.urlQuotes) ? '\"' : '';
				var urlComponent = "url("+ quote + imagesDataMap[absPath].dataUri + quote + ")";
                base64Data = base64Data.replace(item, urlComponent);
				if(opts.verbose == 3) {
					console.info('Successfully converted %s', absPath);
				}
			}
		});

		return base64Data;
	}

	function updateConfig(config){
		if(typeof Object.assign === 'function'){
			Object.assign(opts, config);
		} else {
			for(var x in opts){
				if(config[x]) opts[x] = config[x];
			}
		}

		if(opts.verbose > MAX_VERBOSE_VAL) {opts.verbose = MAX_VERBOSE_VAL;}
		if(opts.verbose < 0) {opts.verbose = 0;}
	}
	return {
		'updateConfig': updateConfig,
		'parseImageUrls': parseImageUrls
	};
})();

