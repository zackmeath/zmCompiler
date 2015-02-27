function Logger(){

};
var parseOut = $("#Parse");
var tokenOut = $("#Tokens");

Logger.verbose = false;

Logger.lex = function(line){
	if(Logger.verbose){
		tokenOut.val(tokenOut.val() + line + "\n");
	}
}
Logger.parse = function(line){
	if(Logger.verbose){
		parseOut.val(parseOut.val() + line + "\n");
	}
}