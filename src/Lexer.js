function Lexer() {

};
Lexer.lex = function(input) {
    Logger.warning("Starting lex...");
    var stringMode = false;
    var output = [];
    //break it up by lines
    var lines = input.split("\n");
    //for each line
    for (var lineNumber = 1; lineNumber <= lines.length; lineNumber++) {
        if (stringMode){
            Error.generateLex("Lex", "Invalid character in string", 'Newline', lineNumber, charNum);
        }
        //do not care about whitespace 
        var line = lines[lineNumber-1].trim();
        var charNum = 0;

        while (line.length > 0) {
            //string mode determines if we should be looking for chars or identifiers
            if (stringMode){
                var tokenData = Lexer.getNextStringToken(line, lineNumber);
            } else {
                var tokenData = Lexer.getNextToken(line, lineNumber);
            }
            if (tokenData.error){
                Error.generateLex("Lex", "invalid token", line[0], lineNumber, charNum);
                Logger.warning("ERROR: Found invalid token: " + line[0]);
                charNum++;
                line = line.substring(1); //lets move to the next character and try again
                if (!stringMode){ // do not get rid of whitespace inside of a string
                    line = line.trim();
                }
            } else {
                if (tokenData.value === "\""){
                    // toggle string mode on every " encountered
                    if (stringMode){
                        Logger.log("Exiting string mode");
                    } else {
                        Logger.log("Entering string mode")
                    }
                    stringMode = !stringMode;
                };
                Logger.warning("Token match: " + tokenData.value + " is a " + tokenData.tokenType)
                var tokenObj = Token.generate(lineNumber, charNum, tokenData.tokenType, tokenData.value);
                output.push(tokenObj);
                charNum += tokenData.offset; 
                line = line.substring(tokenData.offset); //move up to next char after what we found
                if (!stringMode){
                    line = line.trim();
                }
            };
        };
    };
    return output;
};

Lexer.getNextToken = function(line){
    line = line.trim();
    var max = "";
    var maxType = undefined;
    for (var type in Token.types) { //check against every token type
        var match = line.match(Token.types[type].pattern);
        //only a good match if it is the longest match
        if (match != null && match.length > 0 && match[0].length >= 1 && match.length > max.length){
            max = match[0];
            maxType = type;
        };
    };
    if (max === "" && maxType === undefined){ //no match found :(
        return {error: true, offset: 1};
    } else {
        var tok = {
            tokenType: maxType,
            offset: max.length,
            value: max
        };
    };
    return tok;
};

//redundant code, TODO for next iteration
Lexer.getNextStringToken = function(line){
    var max = "";
    var maxType = undefined;
    for (var type in Token.stringTypes) { //check against every token type
        var match = line.match(Token.stringTypes[type].pattern);
        if (match != null && match.length > 0 && match[0].length >= 1 && match.length > max.length){
            max = match[0];
            maxType = type;
        };
    };
    if (max === "" && maxType === undefined){
        return {error: true, offset: 1};
    } else {
        var tok = {
            tokenType: maxType,
            offset: max.length,
            value: max
        };
    };
    return tok;
};

//takes a list of tokens and turns them into a pretty, human readable string for output
Lexer.stringifyTokens = function(tokenList) {
    var out = "Lex was successful!\nList of tokens found:\n";
    for (token in tokenList) {
        var data = tokenList[token]
            out += "\t" + (parseInt(token) + 1) + ": " + data.type + ", " + data.value + "\n";
    };
    return out;
};
