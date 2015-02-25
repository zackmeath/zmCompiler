function Parser() {

};
Parser.parse = function(tokens) {
	console.log(JSON.stringify(tokens));
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
		return Parse.tokens[Parser.tokenNum + 1];
	} else {
		return null;
	}
}
function inc(){
	Parser.tokenNum++;
}

function parseBlock(){
	// {
	parseStatementList();
	// }
}

function parseStatementList(){
	//might be empty if we find }
	parseStatement();
	parseStatementList();
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
		//ERROR
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
				//Error looking for rightparen
			}
		} else {
			//Error looking for leftparen
		}
	} else {
		//Error, looking for print
	}
}
function parseAssignment(){
	if (currentToken().type == "Identifier"){
		inc();
		if (currentToken().type == "Assignment"){
			inc();
			parseExpr();
		} else {
			//Error looking for assignment
		}
	} else {
		//Error looking for identifier
	}
}
function parseVarDecl(){
	
}
function parseWhile(){
	
}
function parseIf(){
	
} 
function parseExpr(){
	
}

