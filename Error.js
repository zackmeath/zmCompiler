function Error(){

};
Error.generateLex = function(type, desc, variable, lineNum, charNum){
	var err = {
		type: "Lex",
		description: desc,
		variable: variable,
		lineNumber: lineNum,
		charNumber: charNum
	};
	Error.lexErrors.push(err);
};
Error.generateParse = function(found, expecting){
	var err {
		type: "Parse",
		found: found,
		expecting: expecting
	};
	Error.parseErrors.push(err)
}
Error.stringifyLex = function(error){
	var errString = error.type + " error found, line: " + error.lineNumber + ", ";
	errString += error.description + " \"" + error.variable + "\"";
	return errString;
};
Error.stringifyLexErrors = function(module){
	if(module === "lex") { 
		var errors = Error.lexErrors;
		var fn = Error.stringifyLex;
	} else if (module === "parse"){
		var errors = Error,parseErrors;
		var fn = Error.stringifyParse
	} else {
		var errors = Error.lexErrors;
		var fn = Error.stringifyLex;
	}
	var output = "";
	for (error in errors) {
		output += fn(errors[error]) + "\n";
	};
	return output;
};
Error.stringifyParse = function(error){
	return errString = "Parse error: expecting: " + error.expecting  + " but found: " + error.found;
};

Error.lexErrors = [];
Error.parseErrors = [];
