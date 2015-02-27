function Error(){

};
Error.generate = function(type, desc, variable, lineNum, charNum){
	var err = {
		type: type,
		description: desc,
		variable: variable,
		lineNumber: lineNum,
		charNumber: charNum
	};
	return err;
};
Error.stringifyLex = function(error){
	var errString = error.type + " error found, line: " + error.lineNumber + ", ";
	errString += error.description + " \"" + error.variable + "\"";
	return errString;
};
Error.stringifyLexErrors = function(errors){
	var output = "";
	for (error in errors) {
		output += Error.stringifyLex(errors[error]) + "\n";
	};
	return output;
};

Error.lexErrors = [];
Error.parseErrors = [];
