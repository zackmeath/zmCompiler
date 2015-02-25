function Parser() {

};
Parser.parse = function(tokens) {
	//console.log(JSON.stringify(tokens));
	Parser.tokenNum = 0;
	Parser.tokens = tokens;
	parseBlock();
	if (currentToken().type == "EoF"){
		//End of file found
	} else {
		//End of file not found
	}
}
function currentToken(){
	return Parser.tokens[Parser.tokenNum];
}
function nextToken(){
	if (Parser.tokenNum < Parser.tokens.length - 1){
		return Parser.tokens[Parser.tokenNum + 1];
	} else {
		return null;
	}
}
function inc(){
	Parser.tokenNum++;
}

function parseBlock(){
	if (currentToken().type == "LeftBrace"){
		inc();
		parseStatementList();
	} else {
		//expecting leftbrace
	}
}

function parseStatementList(){
	//might be empty if we find }
	if (nextToken().type = "RightBrace"){
		inc();
	} else {
		parseStatement();
		parseStatementList();
	}
}

function parseStatement(){
	var token = currentToken().type;
	if (token == "Print"){
		parsePrint();
	} else if (token == "Identifier"){
		parseAssignment();
	} else if (token == "VarType"){
		parseVarDecl();
	} else if (token == "While"){
		parseWhile();
	} else if (token == "If") {
		parseIf();
	} else if (token == "LeftBrace"){
		parseBlock();
	} else {
		//ERROR expecting statement
	}
}
function parsePrint(){
	if (currentToken().type == "Print"){
		inc();
		if (currentToken().type == "LeftParen"){
			inc();
			parseExpr();
			if (currentToken().type == "RightParen"){
				inc();
			} else {
				//expecting rightparen
			}
		} else {
			//expecting leftparen
		}
	} else {
		//expecting print
	}
}
function parseAssignment(){
	if (currentToken().type == "Identifier"){
		inc();
		if (currentToken().type == "Assignment"){
			inc();
			parseExpr();
		} else {
			//expecting assignment
		}
	} else {
		//expecting identifier
	}
}
function parseVarDecl(){
	if (currentToken().type == "VarType"){
		inc();
		if (currentToken().type == "Identifier"){
			inc();
		} else {
			//expecting identifier
		}
	} else {
		//expecting variable type
	}
}
function parseWhile(){
	if (currentToken().type == "While"){
		inc();
		parseBooleanExpr();
		parseBlock();
	} else {
		// expecting a while
	}
}
function parseIf(){
	if (currentToken().type == "If"){
		inc();
		parseBooleanExpr();
		parseBlock();
	} else {
		//expecting an if statement
	}
} 
function parseExpr(){
	var tok = currentToken().type;
	if (tok == "Digit"){
		parseIntExpr();
	} else if (tok == "Quote"){
		parseStringExpr();
	} else if (tok == "LeftParen" || tok == "Bool") {
		parseBooleanExpr();
	} else if (tok == "Identifier"){
		inc();
	} else {
		//error not an expression
	}
}
function parseBooleanExpr(){
	if (currentToken().type == "LeftParen"){
		inc();
		parseExpr();
		parseBoolOp();
		parseExpr();
		if (currentToken().type == "RightParen"){
			inc();
		} else {
			//expecting closing paren
		}
	} else if (currentToken().type == "Bool"){
		inc();
	} else {
		//expecting boolexpr
	}
}
function parseIntExpr(){
	if (currentToken().type == "Digit"){
		inc();
		if (currentToken().type == "Addition"){
			parseIntOp();
			parseExpr();
		}
	} else {
		//expecting digit
	}
}
function parseStringExpr(){
	if (currentToken().type == "Quote"){
		inc();
		parseCharList();
		if (currentToken.type == "Quote"){
			inc();
		} else {
			//expecting closing quote
		}
	} else {
		//expecting Quote for string
	}
	
}
function parseIntOp(){
	if (currentToken().type == "Addition"){
		inc();
	} else {
		//expecting plus sign
	}
}
function parseCharList(){
	var tok = currentToken().type;
	if (tok == "Char" || tok == "Space"){
		inc();
		parseCharList();
	}
}
function parseBoolOp(){
	var tok = currentToken().type;
	if (tok == "Comparison" || tok == "NotComparison"){
		inc();
	} else {
		//expecting boolean operation
	}
}

