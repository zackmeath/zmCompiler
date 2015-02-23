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
Error.stringify = function(error){
	var errString = error.type + " error found, line: " + error.lineNumber + ", ";
	errString += error.description + " \"" + error.variable + "\"";
	return errString;
};
Error.stringifyErrors = function(errors){
	var output = "";
	for (error in errors) {
		output += Error.stringify(errors[error]) + "\n";
	};
	return output;
};

Error.lexErrors = [];
Error.parseErrors = [];
