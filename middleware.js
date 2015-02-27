var compile = document.getElementById("compile");
var input = $("#input"); //where user types code
var parseOut = $("#Parse");
var tokenOut = $("#Tokens");
var verb = $("#verbose");

function cbToggle(event){
	Logger.verbose = !Logger.verbose;
}

$(document).ready(function() {
	//input.linedtextarea();
	//input.val("{\n\tint a\n\ta = 5\n}\n$");
	//input.val("{intff=0intif=5}$");
	input.val("{\nstring a\na = \"t s\"\n}$");
	compile.onclick = compileCode;
	//compileCode();
});

function compileCode() {
	//reset errors
	Error.lexErrors = [];
	Error.parseErrors = [];
	//clear textareas for output
	parseOut.val("");
	tokenOut.val("");
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
		tokenOut.val(tokenOut.val() + Lexer.stringifyTokens(tokens));
		Parser.parse(tokens);
		if (Error.parseErrors.length === 0){
			//parse success!!!
			parseOut.val(parseOut.val() + "Parse Successful!");
		} else {
			parseOut.val(parseOut.val() + Error.stringifyErrors("parse"));
		}
	}
}