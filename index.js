'use strict';
var progeny = require('progeny');
var sysPath = require('path');
var datauriProcessor = require("./datauri-processor");
var InlineDatauri;

module.exports = InlineDatauri = (function() {

	InlineDatauri.prototype.brunchPlugin = true;
	InlineDatauri.prototype.type = 'stylesheet';
	InlineDatauri.prototype.extension = 'css';
	InlineDatauri.prototype.defaultEnv = '*';

	function InlineDatauri(config) {
		if (config == null) config = {};
		if (config.plugins == null) config.plugins = {};
		if (typeof config.plugins.inlineDataUri !== 'undefined' && config.plugins.inlineDataUri !== null){
			datauriProcessor.updateConfig(config.plugins.inlineDataUri);
		}
		
		this.rootPath = config.paths.root;
		this.getDependencies = progeny({rootPath: this.rootPath, reverseArgs: true});
	};

	InlineDatauri.prototype.compile = function(params, callback) {
		return callback(null, params);
	};

	InlineDatauri.prototype.optimize = function(params, callback) {
		var myPath = sysPath.resolve(this.rootPath, sysPath.dirname(params.path));
		var result = datauriProcessor.parseImageUrls(myPath, params.data);
		
		callback(null, { data: result});	
	};

	return InlineDatauri;

})();
