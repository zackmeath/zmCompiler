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
	var err = {
		type: "Parse",
		found: found,
		expecting: expecting
	};
	Error.parseErrors.push(err);
	Logger.parse("Parse Error! found: " + found + ", expecting: " + expecting);
}
Error.stringifyLex = function(error){
	var errString = error.type + " error found, line: " + error.lineNumber + ", ";
	errString += error.description + " \"" + error.variable + "\"";
	return errString;
};
Error.stringifyErrors = function(module){
	var errors;
	var fn;
	if(module === "lex") { 
		errors = Error.lexErrors;
		fn = Error.stringifyLex;
	} else if (module === "parse"){
		errors = Error.parseErrors;
		fn = Error.stringifyParse
	} else {
		errors = Error.lexErrors;
		fn = Error.stringifyLex;
	}
	var output = "";
	for (error in errors) {
		output += fn(errors[error]) + "\n";
	};
	return output;
};
Error.stringifyParse = function(error){
	return errString = "Parse error! Found: " + error.found  + ", expected: " + error.expecting;
};

Error.lexErrors = [];
Error.parseErrors = [];
