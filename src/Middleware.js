var compile = document.getElementById("compile");
var cstButton = document.getElementById("cst");
var astButton = document.getElementById("ast");
var input = $("#input"); //where user types code
var treeOut = $("#TreeTA");
var tokenOut = $("#Tokens");
var verb = $("#verbose");
var output = $("#output");
var programButtons = $("#ProgramButtons");
var compiledPrograms = [];
var currentIndex = null;

function cbToggle(event){
    Logger.verbose = !Logger.verbose;
}

$(document).ready(function() {
    //input.linedtextarea();
    //input.val("{\n   int a\n   a = 5\n}\n$");
    //input.val("{intff=0intif=5}$");
    // input.val("{\nstring a\na = \"t s\"\n}$");
    // input.val("{\n    int a\n    a = 3\n    while (a == 3) {\n        " +
    // 	"print(1 + 2 + 3 + 4 + 5)\n        a = 1 + a\n    }\n    " + 
    // 	"print((true == true))\n    print((false == false))\n} $");
    // input.val('{\n   int a\n   a = 4\n}$');
    input.val("{\n   int a\n   a = 1\n   int c\n   c = 2 + a\n   {\n      string a\n      a = \"a\"\n      print (a)\n   }\n   " + 
            "if (a == 1){\n      print (c)\n   }\n}$\n\n{\na = 1\n}$\n\n{\nint a\na = 1\n}$\n\n{int a \na = 1 + 2 + 3}$");
    output.val('00');
    for (var i = 1; i < 256; i++){
        output.val(output.val() + ' 00');
    }
    compile.onclick = compileCode;
    cstButton.onclick = showCST;
    astButton.onclick = showAST;
    compileCode(); // Comment this out to not compile on load
});

function compileCode() {
    compiledPrograms = [];
    var inputCode = input.val().trim();
    var programs = inputCode.split('$');
    var outputs = []; // list of output objects
    // Output Object Structure
    // {
    // success: boolean
    // failedOn: string (Lex | Parse | SemanticAnalysis)
    // log: contents of the log output after compiling
    // errors: []
    // tokens: []
    // cst: tree
    // ast: tree
    // generatedCode: string
    // }
    programs.forEach(function(program){
        if(program.length > 0){
            outputs.push(compileCodeBlock(program + '$'));
        }
    });
    compiledPrograms = outputs;
    // Reset buttons
    programButtons.empty();
    for(var i = 0; i < compiledPrograms.length; i++){
        var program = compiledPrograms[i];
        buttonType = program.success ? 'success' : 'danger';
        var button = '<button id=\"Program' + i + '\" type=\"button\" class=\"btn btn-xs btn-' + buttonType + '\">Program #' + i + '</button>';
        programButtons.append(button);
        $("#Program" + i).on('click', function(e){
            currentIndex = parseInt(this.id.substr(7));
            var programObject = compiledPrograms[currentIndex];
            tokenOut.val(programObject.log);
            output.val(programObject.generatedCode);
            $('#tree1').tree('destroy');
            treeOut.tree('destroy');
        });
    }
    currentIndex = compiledPrograms.length - 1;
}

function compileCodeBlock(inputProgram) {
    var outputObject = {input: inputProgram, success: true};

    // reset errors
    Error.lexErrors = [];
    Error.parseErrors = [];
    Error.semanticErrors = [];
    Error.codeGenErrors = [];

    // reset display
    tokenOut.val('');

    // lex
    outputObject.tokens = Lexer.lex(inputProgram);
    if(Error.lexErrors.length > 0) {
        outputObject.success = false;
        outputObject.failedOn = "Lex";
        outputObject.errors = Error.stringifyErrors("lex");
        outputObject.log = tokenOut.val();
        return outputObject;
    }
    Logger.warning('Lex successful!');

    // Parse
    Parser.parse(outputObject.tokens);
    if (Error.parseErrors.length > 0){
        outputObject.success = false;
        outputObject.failedOn = "Parse";
        outputObject.errors = Error.stringifyErrors("parse");
        outputObject.log = tokenOut.val();
        return outputObject;
    }
    Logger.warning('Parse successful!');

    // Semantic Analysis
    if (Parser.cst === null){
        outputObject.success = false;
        outputObject.failedOn = "Parse";
        outputObject.errors = "Parser did not successfully generate a CST";
        outputObject.log = tokenOut.val();
        return outputObject;
    }
    outputObject.cst = Parser.cst;
    outputObject.ast = SemanticAnalyser.generateAST(Parser.cst)
    SemanticAnalyser.analyze();
    if(Error.semanticErrors.length > 0){
        outputObject.success = false;
        outputObject.failedOn = "Semantic Analysis";
        outputObject.errors = Error.stringifyErrors("semantic");
        outputObject.log = tokenOut.val();
        return outputObject;
    }
    Logger.warning('Semantic Analysis successful!');
    outputObject.symbolTable = SemanticAnalyser.buildSymbolTable();
    Display.symbolTable(outputObject.symbolTable);
    outputObject.generatedCode = CodeGen.generateCode(SemanticAnalyser.ast);
    if (Error.codeGenErrors > 0){
        outputObject.success = false;
        outputObject.failedOn = "Code Generation";
        outputObject.errors = Error.stringifyErrors("codeGen");
        outputObject.log = tokenOut.val();
        return outputObject;
    }
    outputObject.log = tokenOut.val();
    Logger.warning('Code Generation successful!');
    return outputObject;
}

function showCST(){
    if (currentIndex === -1){
        alert('Cannot display CST: There is no compiled program selected');
        return;
    }
    var prog = compiledPrograms[currentIndex];
    if (prog === undefined){
        alert('Cannot display CST: Program does not exist');
        return;
    }
    if (prog.cst === null || prog.cst === undefined){
        alert('Cannot display CST: CST was never generated due to errors in program');
        return;
    }
    prog.cst.displayTree();
}
function showAST(){
    if (currentIndex === -1){
        alert('Cannot display AST: There is no compiled program selected');
        return;
    }
    var prog = compiledPrograms[currentIndex];
    if (prog === undefined){
        alert('Cannot display AST: Program does not exist');
        return;
    }
    if (prog.ast === null || prog.ast === undefined){
        alert('Cannot display AST: AST was never generated due to errors in program');
        return;
    }
    prog.ast.displayTree();
}

//enable tabbing in code area
$("textarea").keydown(function(e) {
    if(e.keyCode === 9) { // tab was pressed
        // get caret position/selection
        var start = this.selectionStart;
        var end = this.selectionEnd;

        var $this = $(this);
        var value = $this.val();

        // set textarea value to: text before caret + tab + text after caret
        $this.val(value.substring(0, start)
                + "   "
                + value.substring(end));

        // put caret at right position again (add one for the tab)
        this.selectionStart = this.selectionEnd = start + 1;

        // prevent the focus lose
        e.preventDefault();
    }
});
