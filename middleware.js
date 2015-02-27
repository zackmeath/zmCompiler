var compile = document.getElementById("compile");
var input = $("#input");
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
	compileCode();
});

function compileCode() {
	Error.lexErrors = [];
	Error.parseErrors = [];
	parseOut.val("");
	tokenOut.val("");

	var tokens = Lexer.lex(input.val().trim());
	if(Error.lexErrors.length > 0) {
		if (tokenOut.val().length > 3){
			tokenOut.val(tokenOut.val() + "\n");
		}
		tokenOut.val(tokenOut.val() + Error.stringifyLexErrors(Error.lexErrors));
	} else {
		if (tokenOut.val().length > 3){
			tokenOut.val(tokenOut.val() + "\n");
		}
		tokenOut.val(tokenOut.val() + Lexer.stringifyTokens(tokens));
		var cst = Parser.parse(tokens);
	}
}