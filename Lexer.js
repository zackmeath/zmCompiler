function Lexer() {

};
Lexer.lex = function(input) {
	var stringMode = false;
	var output = [];
	//break it up by lines
	var lines = input.split("\n");
	//for each line
	for (var lineNumber = 1; lineNumber <= lines.length; lineNumber++) { 
		var line = lines[lineNumber-1].trim();
		var charNum = 0;

		while (line.length > 0) {
			//console.log(line);
			if (stringMode){
				var tokenData = Lexer.getNextStringToken(line, lineNumber);
			} else {
				var tokenData = Lexer.getNextToken(line, lineNumber);
			}
			//console.log(JSON.stringify(tokenData));
			if (tokenData.error){
				var err = Error.generate("Lex", "invalid token", line[0], lineNumber, charNum);
				Error.lexErrors.push(err);
				charNum++;
				line = line.substring(1);
				if (!stringMode){
					line = line.trim();
				}
			} else {
				if (tokenData.value == "\""){
					stringMode = !stringMode;
				};
				var tokenObj = Token.generate(lineNumber, charNum, tokenData.tokenType, tokenData.value);
				output.push(tokenObj);
				//console.log(JSON.stringify(tokenObj));
				charNum += tokenData.offset;
				line = line.substring(tokenData.offset);
				if (!stringMode){
					line = line.trim();
				}
			};
		};
	};
	return output;
};

Lexer.getNextToken = function(line){
	line = line.trim();
	var max = "";
	var maxType = undefined;
	for (var type in Token.types) { //check against every token type
		var match = line.match(Token.types[type].pattern);
		if (match != null && match.length > 0 && match[0].length >= 1 && match.length > max.length){
			max = match[0];
			maxType = type;
		};
	};
	if (max == "" && maxType == undefined){
		//ENTER LEX ERROR HERE (no match)
		
		return {error: true, offset: 1};
	} else {
		var tok = {
			tokenType: maxType,
			offset: max.length,
			value: max
		};
	};
	return tok;
};

Lexer.getNextStringToken = function(line){
	var max = "";
	var maxType = undefined;
	for (var type in Token.stringTypes) { //check against every token type
		var match = line.match(Token.stringTypes[type].pattern);
		if (match != null && match.length > 0 && match[0].length >= 1 && match.length > max.length){
			max = match[0];
			maxType = type;
		};
	};
	if (max == "" && maxType == undefined){
		//ENTER LEX ERROR HERE (no match)
		return {error: true, offset: 1};
	} else {
		var tok = {
			tokenType: maxType,
			offset: max.length,
			value: max
		};
	};
	return tok;
};

Lexer.stringifyTokens = function(tokenList) {
	var out = "Lex was seccuessful!\nList of tokens found:\n";
	for (token in tokenList) {
		var data = tokenList[token]
		out += token + ": " + data.type + ", " + data.value + "\n";
	};
	return out;
};