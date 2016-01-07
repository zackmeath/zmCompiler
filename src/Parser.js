function Parser() {

};
Parser.cst = undefined;
Parser.parse = function(tokens) {
    Parser.stringBuffer = '';
    Parser.cst = undefined;
    Parser.cst = new Tree();
    Parser.cst.addBranchNode('Program');

    Logger.warning("\nStarting parse...");
    Parser.tokenNum = 0;
    Parser.tokens = tokens;
    parseBlock();
    Parser.cst.returnToParent(); // should be root
    if (currentToken() && currentToken() === "EoF"){
        //parse success!!! (if there arent errors)
        consumeToken();
        if(currentToken() !== "\'End of input\'"){
            Error.generateParse(currentToken(), 'End of input');
        }
    } else if (Error.parseErrors.length === 0){
        if (Parser.tokenNum === Parser.tokens.length - 1){
            Logger.warning("(\'$\') token not found, inserted automatically");
            Parser.tokens.push(Token.generate(0, 0, 'EoF', '$'));
        } else {
            Error.generateParse(currentToken(), "EoF ($)");
        }
    } else {
        //we have errors, middleware will handle showing them to the user
    }
} 
//shorthand for getting the current token
function currentToken(){
    if (Parser.tokenNum >= (Parser.tokens.length)){
        return "\'End of input\'"; // no more tokens left to parse
    }
    return Parser.tokens[Parser.tokenNum].type;
}
//moves pointer up one and logs the token as consumed
function consumeToken(){

    if (Parser.tokens[Parser.tokenNum].value === '\"'){
        if (Parser.stringBuffer.length === 0){
            Parser.stringBuffer += Parser.tokens[Parser.tokenNum].value;
        } else {
            Parser.stringBuffer += Parser.tokens[Parser.tokenNum].value;
            Parser.cst.addLeafNode(Parser.stringBuffer);
            Parser.stringBuffer = '';
        }
    } else {
        if (Parser.tokens[Parser.tokenNum].value !== '$' && Parser.stringBuffer.length === 0){
            Parser.cst.addLeafNode(Parser.tokens[Parser.tokenNum]);
        } else if (Parser.stringBuffer.length !== 0){
            Parser.stringBuffer += Parser.tokens[Parser.tokenNum].value;
        }
    }
    Logger.log((Parser.tokenNum + 1) + ": \'" + Parser.tokens[Parser.tokenNum].value 
            + "\' type: " + Parser.tokens[Parser.tokenNum].type);
    Parser.tokenNum++;
}

function parseBlock(){
    Parser.cst.addBranchNode('Block');
    Logger.log("Parsing Block");
    if (currentToken() === "LeftBrace"){
        consumeToken();
        parseStatementList();
        Parser.cst.returnToParent();
    } else {
        Error.generateParse(currentToken(), "LeftBrace");
    }
}

function parseStatementList(){
    Parser.cst.addBranchNode('StatementList');
    Logger.log("Parsing statement list");
    if (currentToken() === "RightBrace"){
        consumeToken();
        Parser.cst.returnToParent();
    } else {
        if(parseStatement()){ // returns true if there is a statement present
            parseStatementList();
            Parser.cst.returnToParent();
        } else {
            //epsilon
        }
    }
}

function parseStatement(){
    Parser.cst.addBranchNode('Statement');
    Logger.log("Parsing statement");
    var token = currentToken();
    if (token === "Print"){
        Logger.log("Print statement found, going to print...");
        parsePrint();
        Parser.cst.returnToParent();
        return true;
    } else if (token === "Identifier"){
        Logger.log("Identifier found, going to assignment...");
        parseAssignment();
        Parser.cst.returnToParent();
        return true;
    } else if (token === "VarType"){
        Logger.log("VarType found, going to VarDecl...");
        parseVarDecl();
        Parser.cst.returnToParent();
        return true;
    } else if (token === "While"){
        Logger.log("While found, going to while...");
        parseWhile();
        Parser.cst.returnToParent();
        return true;
    } else if (token === "If") {
        Logger.log("If statement found, going to if...");
        parseIf();
        Parser.cst.returnToParent();
        return true;
    } else if (token === "LeftBrace"){
        Logger.log("\'{\' found, going to new block...");
        parseBlock();
        Parser.cst.returnToParent();
        return true;
    } else {
        Error.generateParse(currentToken(), "Statement or \'}\'");
        return false;
    }
}
function parsePrint(){
    Parser.cst.addBranchNode('Print');
    Logger.log("Parsing print");
    if (currentToken() === "Print"){
        consumeToken();
        if (currentToken() === "LeftParen"){
            consumeToken();
            parseExpr();
            if (currentToken() === "RightParen"){
                consumeToken();
                Parser.cst.returnToParent();
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
    Parser.cst.addBranchNode('Assignment');
    Logger.log("Parsing Assignment");
    if (currentToken() === "Identifier"){
        Parser.cst.addBranchNode('Id');
        Parser.cst.addBranchNode('Char');
        consumeToken();
        Parser.cst.returnToParent();
        Parser.cst.returnToParent();
        if (currentToken() === "Assignment"){
            consumeToken();
            parseExpr();
            Parser.cst.returnToParent();
        } else {
            Error.generateParse(currentToken(), "\'=\'");
        }
    } else {
        Error.generateParse(currentToken(), "Identifier");
    }
}
function parseVarDecl(){
    Parser.cst.addBranchNode('VarDecl');
    Logger.log("Parsing VarDecl");
    if (currentToken() === "VarType"){
        Parser.cst.addBranchNode('Type');
        consumeToken();
        Parser.cst.returnToParent();
        if (currentToken() === "Identifier"){
            Parser.cst.addBranchNode('Id');
            Parser.cst.addBranchNode('Char');
            consumeToken();
            Parser.cst.returnToParent();
            Parser.cst.returnToParent();
            Parser.cst.returnToParent();
        } else {
            Error.generateParse(currentToken(), "Identifier");
        }
    } else {
        Error.generateParse(currentToken(), "VarType");
    }
}
function parseWhile(){
    Parser.cst.addBranchNode('While');
    Logger.log("Parsing while");
    if (currentToken() === "While"){
        consumeToken();
        parseBooleanExpr();
        parseBlock();
        Parser.cst.returnToParent();
    } else {
        Error.generateParse(currentToken(), "\'while\' statement");
    }
}
function parseIf(){
    Parser.cst.addBranchNode('If');
    Logger.log("Parsing if");
    if (currentToken() === "If"){
        consumeToken();
        parseBooleanExpr();
        parseBlock();
        Parser.cst.returnToParent();
    } else {
        Error.generateParse(currentToken(), "\'if\' statement");
    }
} 
function parseExpr(){
    Parser.cst.addBranchNode('Expr');
    Logger.log("Parsing expr");
    var tok = currentToken();
    if (tok === "Digit"){
        parseIntExpr();
        Parser.cst.returnToParent();
    } else if (tok === "Quote"){
        parseStringExpr();
        Parser.cst.returnToParent();
    } else if (tok === "LeftParen" || tok === "Bool") {
        parseBooleanExpr();
        Parser.cst.returnToParent();
    } else if (tok === "Identifier"){
        Parser.cst.addBranchNode('Id');
        Parser.cst.addBranchNode('Char');
        consumeToken();
        Parser.cst.returnToParent();
        Parser.cst.returnToParent();
        Parser.cst.returnToParent();
    } else {
        Error.generateParse(currentToken(), "Expression");
    }
}
function parseBooleanExpr(){
    Parser.cst.addBranchNode('BooleanExpr');
    Logger.log("Parsing BooleanExpr");
    if (currentToken() === "LeftParen"){
        consumeToken();
        parseExpr();
        parseBoolOp();
        parseExpr();
        if (currentToken() === "RightParen"){
            consumeToken();
            Parser.cst.returnToParent();
        } else {
            Error.generateParse(currentToken(), "\')\'");
        }
    } else if (currentToken() === "Bool"){
        Parser.cst.addBranchNode('BoolValue');
        consumeToken();
        Parser.cst.returnToParent();
        Parser.cst.returnToParent();
    } else {
        Error.generateParse(currentToken(), "Boolean Expression");
    }
}
function parseIntExpr(){
    Parser.cst.addBranchNode('IntExpr');
    Logger.log("Parsing IntExpr");
    if (currentToken() === "Digit"){
        Parser.cst.addBranchNode('Digit');
        consumeToken();
        Parser.cst.returnToParent();
        if (currentToken() === "Addition"){
            parseIntOp();
            parseExpr();
            Parser.cst.returnToParent();
        } else {
            Parser.cst.returnToParent();
        }
    } else {
        Error.generateParse(currentToken(), "digit");
    }
}
function parseStringExpr(){
    Parser.cst.addBranchNode('StringExpr');
    Logger.log("Parsing stringExpr");
    if (currentToken() === "Quote"){
        consumeToken();
        parseCharList();
        if (currentToken() === "Quote"){
            consumeToken();
            Parser.cst.returnToParent();
        } else {
            Error.generateParse(currentToken(), "\"");
        }
    } else {
        Error.generateParse(currentToken(), "\"");
    }

}
function parseIntOp(){
    Parser.cst.addBranchNode('IntOP');
    Logger.log("Parsing intOp");
    if (currentToken() === "Addition"){
        consumeToken();
        Parser.cst.returnToParent();
    } else {
        Error.generateParse(currentToken(), "\'+\'");
    }
}
function parseCharList(){
    Logger.log("Parsing charList");
    var tok = currentToken();
    if (tok === "Char" || tok === "Space"){
        consumeToken();
        parseCharList();
    } else if (tok === "Quote"){
        //go back up recursive stack, this string is ending
    } else {
        Error.generateParse(currentToken(), "end quote (\"), char, or space");
    }
}
function parseBoolOp(){
    Parser.cst.addBranchNode('BoolOp');
    Logger.log("Parsing boolOp");
    var tok = currentToken();
    if (tok === "Comparison" || tok === "NotComparison"){
        consumeToken();
        Parser.cst.returnToParent();
    } else {
        Error.generateParse(currentToken(), "\'==\' or \'!=\'");
    }
}

