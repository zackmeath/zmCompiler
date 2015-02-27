function Parser() {

};
Parser.parse = function(tokens) {
	Logger.parse("Starting parse...");
	Parser.tokenNum = 0;
	Parser.tokens = tokens;
	parseBlock();
	if (currentToken() && currentToken() === "EoF"){
		//parse success!!!
		consumeToken();
	} else if (Error.parseErrors.length === 0){
		Logger.parseWarning("Warning: No EoF(\'$\'') token found, inserted automatically");
		Parser.tokens.push(Token.generate(0, 0, 'EoF', '$'));
	} else {

	}
} 
function currentToken(){
	if (Parser.tokenNum >= (Parser.tokens.length)){
		return "\'End of input\'";
	}
	return Parser.tokens[Parser.tokenNum].type;
}
function consumeToken(){
	Logger.parse("\tFound Terminal " + (Parser.tokenNum + 1) + ": " + Parser.tokens[Parser.tokenNum].type);
	console.log(JSON.stringify(Parser.tokens));
	Parser.tokenNum++;
}

function parseBlock(){
	Logger.parse("Parsing Block");
	if (currentToken() === "LeftBrace"){
		consumeToken();
		parseStatementList();
	} else {
		Error.generateParse(currentToken(), "LeftBrace");
	}
}

function parseStatementList(){
	Logger.parse("Parsing statement list");
	if (currentToken() === "RightBrace"){
		consumeToken();
	} else {
		if(parseStatement()){
			parseStatementList();
		}
	}
}

function parseStatement(){
	Logger.parse("Parsing statement");
	var token = currentToken();
	if (token === "Print"){
		Logger.parse("Print statement found, going to print...");
		parsePrint();
		return true;
	} else if (token === "Identifier"){
		Logger.parse("Identifier found, going to assignment...");
		parseAssignment();
		return true;
	} else if (token === "VarType"){
		Logger.parse("VarType found, going to VarDecl...");
		parseVarDecl();
		return true;
	} else if (token === "While"){
		Logger.parse("While found, going to while...");
		parseWhile();
		return true;
	} else if (token === "If") {
		Logger.parse("If statement found, going to if...");
		parseIf();
		return true;
	} else if (token === "LeftBrace"){
		Logger.parse("\'{\' found, going to new block...");
		parseBlock();
		return true;
	} else {
		Error.generateParse(currentToken(), "Statement or \'}\'");
		return false;
	}
}
function parsePrint(){
	Logger.parse("Parsing print");
	if (currentToken() === "Print"){
		consumeToken();
		if (currentToken() === "LeftParen"){
			consumeToken();
			parseExpr();
			if (currentToken() === "RightParen"){
				consumeToken();
			} else {
				Error.generateParse(currentToken(), "\')\'");
			}
		} else {
			Error.generateParse(currentToken(), "\'(\'");
		}
	} else {
		Error.generateParse(currentToken(), "\'print\' statement");
	}
}
function parseAssignment(){
	Logger.parse("Parsing Assignment");
	if (currentToken() === "Identifier"){
		consumeToken();
		if (currentToken() === "Assignment"){
			consumeToken();
			parseExpr();
		} else {
			Error.generateParse(currentToken(), "\'=\'");
		}
	} else {
		Error.generateParse(currentToken(), "Identifier");
	}
}
function parseVarDecl(){
	Logger.parse("Parsing VarDecl");
	console.log(currentToken());
	if (currentToken() === "VarType"){
		consumeToken();
		console.log(currentToken());
		if (currentToken() === "Identifier"){
			consumeToken();
		} else {
			Error.generateParse(currentToken(), "Identifier");
		}
	} else {
		Error.generateParse(currentToken(), "VarType");
	}
}
function parseWhile(){
	Logger.parse("Parsing while");
	if (currentToken() === "While"){
		consumeToken();
		parseBooleanExpr();
		parseBlock();
	} else {
		Error.generateParse(currentToken(), "\'while\' statement");
	}
}
function parseIf(){
	Logger.parse("Parsing if");
	if (currentToken() === "If"){
		consumeToken();
		parseBooleanExpr();
		parseBlock();
	} else {
		Error.generateParse(currentToken(), "\'if\' statement");
	}
} 
function parseExpr(){
	Logger.parse("Parsing expr");
	var tok = currentToken();
	if (tok === "Digit"){
		parseIntExpr();
	} else if (tok === "Quote"){
		parseStringExpr();
	} else if (tok === "LeftParen" || tok === "Bool") {
		parseBooleanExpr();
	} else if (tok === "Identifier"){
		consumeToken();
	} else {
		Error.generateParse(currentToken(), "Expression");
	}
}
function parseBooleanExpr(){
	Logger.parse("Parsing BooleanExpr");
	if (currentToken() === "LeftParen"){
		consumeToken();
		parseExpr();
		parseBoolOp();
		parseExpr();
		if (currentToken() === "RightParen"){
			consumeToken();
		} else {
			Error.generateParse(currentToken(), "\')\'");
		}
	} else if (currentToken() === "Bool"){
		consumeToken();
	} else {
		Error.generateParse(currentToken(), "Boolean Expression");
	}
}
function parseIntExpr(){
	Logger.parse("Parsing IntExpr");
	if (currentToken() === "Digit"){
		consumeToken();
		if (currentToken() === "Addition"){
			parseIntOp();
			parseExpr();
		} else{
			Error.generateParse(currentToken(), "\'+\'");
		}
	} else {
		Error.generateParse(currentToken(), "digit");
	}
}
function parseStringExpr(){
	Logger.parse("Parsing stringExpr");
	if (currentToken() === "Quote"){
		consumeToken();
		parseCharList();
		if (currentToken() === "Quote"){
			consumeToken();
		} else {
			Error.generateParse(currentToken(), "\"");
		}
	} else {
		Error.generateParse(currentToken(), "\"");
	}
	
}
function parseIntOp(){
	Logger.parse("Parsing intOp");
	if (currentToken() === "Addition"){
		consumeToken();
	} else {
		Error.generateParse(currentToken(), "\'+\'");
	}
}
function parseCharList(){
	Logger.parse("Parsing charList");
	var tok = currentToken();
	if (tok === "Char" || tok === "Space"){
		consumeToken();
		parseCharList();
	} else if (tok === "Quote"){
		//go back up recursive stack
	} else {
		Error.generateParse(currentToken(), "end quote (\"), char, or space");
	}
}
function parseBoolOp(){
	Logger.parse("Parsing boolOp");
	var tok = currentToken();
	if (tok === "Comparison" || tok === "NotComparison"){
		consumeToken();
	} else {
		Error.generateParse(currentToken(), "\'==\' or \'!=\'");
	}
}

