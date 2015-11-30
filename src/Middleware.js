var compile = document.getElementById("compile");
var cstButton = document.getElementById("cst");
var astButton = document.getElementById("ast");
var input = $("#input"); //where user types code
var treeOut = $("#TreeTA");
var tokenOut = $("#Tokens");
var verb = $("#verbose");
var output = $("#output");
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
		"if (a == 1){\n      print (c)\n   }\n}$");
	output.val('00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ' + 
		'00 00 00 00 00 00 00 00 00 00 00');
	compile.onclick = compileCode;
	cstButton.onclick = showCST;
	astButton.onclick = showAST;
	compileCode(); // Comment this out to not compile on load
});

function compileCode() {
	//reset errors
	Error.lexErrors = [];
	Error.parseErrors = [];
	Error.semanticErrors = [];
	Error.codeGenErrors = [];
	//clear textareas for output
	treeOut.val("");
	tokenOut.val("");
	$('#tree1').tree('destroy');
	//lex
	var tokens = Lexer.lex(input.val().trim());
	//if there are no errors, yay!
	if(Error.lexErrors.length > 0) {
		//add newline if there is already output in the textarea
		if (tokenOut.val().length > 3){
			tokenOut.val(tokenOut.val() + "\n");
		}
		tokenOut.val(tokenOut.val() + Error.stringifyErrors("lex"));
	} else {
		//add newline if there ia already output there
		if (tokenOut.val().length > 3){
			tokenOut.val(tokenOut.val() + "\n");
		}
		tokenOut.val(tokenOut.val() + Lexer.stringifyTokens(tokens) + '\n\n');
		Parser.parse(tokens);
		if (Error.parseErrors.length === 0){
			//parse success!!!
			//Parser.cst.displayTree();
			tokenOut.val(tokenOut.val() + "Parse Successful!\n");
			if (Parser.cst !== null){
				Logger.semanticLog('\nStarting semantic analysis... \n');
				SemanticAnalyser.generateAST(Parser.cst)
				SemanticAnalyser.analyze();
				if(Error.semanticErrors.length === 0){
					Logger.semanticWarning('\nSemantic Analysis Successful!');
					SemanticAnalyser.buildSymbolTable();
					SemanticAnalyser.displaySymbolTable();
					Logger.codeGenWarning('\nStarting code generation...\n');
					CodeGen.generateCode(SemanticAnalyser.ast);
				} else {
					tokenOut.val(tokenOut.val() + Error.stringifyErrors("semantic"));
				}
			}
		} else {
			tokenOut.val(tokenOut.val() + Error.stringifyErrors("parse"));
		}
	}
}

function showCST(){
	if (Parser.cst){
		Parser.cst.displayTree();
	}
}
function showAST(){
	if (SemanticAnalyser.ast){
		SemanticAnalyser.ast.displayTree();
	}
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
