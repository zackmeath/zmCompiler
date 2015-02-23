var compile = document.getElementById("compile");
var input = $("#input");
var parseOut = $("#Parse");
var tokenOut = $("#Tokens");

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
	var tokens = Lexer.lex(input.val().trim());
	if(Error.lexErrors.length > 0) {
		tokenOut.val(Error.stringifyErrors(Error.lexErrors));
	} else {
		tokenOut.val(Lexer.stringifyTokens(tokens));
		var cst = Parser.parse(tokens);
	}
}
