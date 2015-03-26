function Logger(){

};
var parseOut = $("#Parse");
var tokenOut = $("#Tokens");

//keep track of checkbox status
Logger.verbose = false;

Logger.lex = function(line){
	if(Logger.verbose){
		tokenOut.val(tokenOut.val() + line + "\n");
	}
}
Logger.parse = function(line){
	if(Logger.verbose) {
		parseOut.val(parseOut.val() + line + "\n");
	}
}
//overwrite verbose restriction (this is important stuff!)
Logger.parseWarning = function(line){
	parseOut.val(parseOut.val() + line + "\n");
}