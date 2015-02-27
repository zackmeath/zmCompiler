function Token(){

};
Token.generate = function(lineNum, charNum, typ, val){
	var out = {
		lineNumber: lineNum,
		charNumber: charNum,
		type: typ,
		value: val,
	};
	return out;
}
//these are the only types of tokens expected in string mode
Token.stringTypes = {
	Char: {
		type: "character",
		pattern: /^[a-z]/,
	},
	Space: {
		type: "space",
		pattern: /^(\s)/
	},
	Quote: {
		type: "quote",
		pattern: /^"/,
	},
};
//types of tokens expected in normal mode
Token.types = {
	LeftBrace: {
		type: "left brace",
		pattern: /^{/,
	},
	RightBrace: {
		type: "right brace",
		pattern: /^}/,
	},
	LeftParen: {
		type: "left parenthesis",
		pattern: /^\(/,
	},
	RightParen: {
		type: "right parenthesis",
		pattern: /^\)/,
	},
	EoF: {
		type: "end of file",
		pattern: /^\$/,
	},
	Print: {
		type: "print",
		pattern: /^print/,
	},
	While: {
		type: "while",
		pattern: /^while/,
	},
	If: {
		type: "if",
		pattern: /^if/,
	},
	Quote: {
		type: "quotation",
		pattern: /^"/,
	},
	VarType: {
		type: "variable type declaration",
		pattern: /^(boolean|string|int)/,
	},
	Bool: {
		type: "boolean value",
		pattern: /^(true|false)/,
	},
	Comparison: {
		type: "comparison operator",
		pattern: /^==/,
	},
	NotComparison: {
		type: "not comparison operator",
		pattern: /^!=/,
	},
	Addition: {
		type: "addition operator",
		pattern: /^\+/,
	},
	Assignment: {
		type: "assignment operator",
		pattern: /^=/,
	},
	Identifier: {
		type: "identifier",
		pattern: /^[a-z]/,
	},
	Digit: {
		type: "digit",
		pattern: /^[0-9]/,
	}
};
