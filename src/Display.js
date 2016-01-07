function Display(){
};

Display.program = function(object){
    // clear textareas for output
    treeOut.val("");
    tokenOut.val("");
    $('#tree1').tree('destroy');
    // if success == false, do not display standard stuff
    tokenOut.val(Lexer.stringifyTokens(outputObject.tokens) + '\n\n');
    outputObject.ast.displayTree();
    Display.symbolTable(outputObject.symbolTable);
}

Display.symbolTable = function (table){
    Logger.warning('\nSymbol Table:');
    Logger.warning('Scope  ID   Type');
    Object.keys(table).forEach(function(entry){
        Logger.warning('  ' + entry.charAt(0) + '     ' + SemanticAnalyser.symbolTable[entry].id +
                '    ' + SemanticAnalyser.symbolTable[entry].type);
    });
}
