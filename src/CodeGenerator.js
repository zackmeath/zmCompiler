function CodeGen(){

}
CodeGen.staticTable = {};
CodeGen.jumpTable = {};

CodeGen.generateCode = function(ast, symbolTable){
    // Reset CodeGen

    CodeGen.staticTable = {};                         // Table for variable location references
    CodeGen.jumpTable   = {};                         // Keeps track of jump distances
    CodeGen.code        = [];                         // Array of bytes that represent the code generated
    CodeGen.endBytes    = [];                         // Array of bytes to be appended at the end of the program
    CodeGen.jumpNum     = 0;                          // Tracks the current jump reference for jump table
    CodeGen.parentScope = SemanticAnalyser.lastScope; // References the outermost scope
    CodeGen.symbolTable = symbolTable;
    CodeGen.variableKeyNumber = 0;

    Logger.warning('\nStarting Code Generation...');

    generateCode(ast);
    CodeGen.backpatch();
    var result = Logger.writeMachineCode(CodeGen.code, CodeGen.endBytes);
    return result;
}

CodeGen.backpatch = function(){
    // Create variable references via the static table to allow a location for each variable
    var backpatchTable = {};
    var nextPosition = CodeGen.code.length + 1;
    for (var key in CodeGen.staticTable) {
        var val = CodeGen.staticTable[key];
        backpatchTable[val] = intToHex(nextPosition++);
    }

    // Traverse the CodeGen.code array and replace all references with real location
    for (var i = 0; i < CodeGen.code.length; i++){
        var code = CodeGen.code[i];
        if (backpatchTable[code] !== undefined){
            CodeGen.code[i] = backpatchTable[code];
        }

        // While traversing, why not also fill in jump table values
        if (CodeGen.jumpTable[code] !== undefined){
            CodeGen.code[i] = intToHex(CodeGen.jumpTable[code]);
        }
    }
}

var generateCode = function(ast){

    var scopeRoot    = {num: 0, parent: null, children: []};
    var nextScope    = 1;
    var currentScope = scopeRoot;

    var evaluateNode = function(node){

        var exitScope     = false;
        var endIf         = false;
        var endWhile      = false;
        var jumpKey       = 'J' + CodeGen.jumpNum;
        var genFirstChild = true;

        if (node.value === '{}'){
            exitScope = true;
            currentScope.children.push({num: nextScope++, parent: currentScope, children:[]});
            currentScope = currentScope.children[currentScope.children.length - 1];
        } else if(node.value === '='){
            genAssignment(node, currentScope);
        } else if (node.value === 'print'){
            genPrint(node, currentScope);
        } else if (node.value === 'VarDecl'){
            genVarDecl(node, currentScope);
        } else if(node.value === 'If'){
            endIf = true;
            CodeGen.jumpNum++;
            genIf(node, currentScope);
            genFirstChild = false;
        } else if(node.value === 'while'){
            CodeGen.jumpNum++;
            endIf = true;
            genWhile(node, currentScope);
            genFirstChild = false;
        } else {
            // No other cases
            return;
        }

        var previousCodeLength = CodeGen.code.length;

        var startingIndex = (genFirstChild) ? 0 : 1;
        for (var i = startingIndex; i < node.children.length; i++) {
            var child = node.children[i];
            evaluateNode(child);
        }

        var currentCodeLength = CodeGen.code.length;
        var jumpLength = (currentCodeLength - previousCodeLength);

        if (endIf) {
            CodeGen.jumpTable[jumpKey] = jumpLength;
            CodeGen.jumpNum++;
        }
        if (endWhile) {
            CodeGen.jumpTable[jumpKey] = jumpLength;
            CodeGen.jumpNum++;
        }
        if (exitScope) { currentScope = currentScope.parent; }
    }
    evaluateNode(ast.root);
}

var genVarDecl = function(node, scope) {
    var key = getVariableKey(node.children[1].value, scope);
    loadAcc(0);
    storeAcc(key);
}

var genAssignment = function(node, scope) {
    var key = getVariableKey(node.children[0].value, scope);
    var value = node.children[1].value;
    if(!isNaN(parseInt(value))) { // Number constant
        loadAcc(parseInt(value));
        storeAcc(key);
    } else if (value.substr(0,1) === '\"') { // String constant
        var stringValue = value.substr(1, value.length - 2);
        var stringLocation = getStringLocation(stringValue, scope);
        loadAcc(stringLocation);
        storeAcc(key);
    } else if (value === '+') { // Addition
        assignVariableKey('+', 0);
        var storageLocation = CodeGen.staticTable['+' + 0];
        var add = function(node) {
            var firstChild = node.children[0];
            var secondChild = node.children[1];
            if(secondChild.value === '+'){
                add(secondChild);
                storeAcc(storageLocation);
            } else {
                if (isNaN(parseInt(secondChild.value))) { // Variable
                    loadAccMem(getVariableKey(secondChild.value, scope));
                } else { // Int
                    loadAcc(parseInt(secondChild.value));
                }
                storeAcc(storageLocation);
            }
            if (isNaN(parseInt(firstChild.value))) { // Variable
                loadAccMem(getVariableKey(firstChild.value, scope));
            } else { // Constant
                loadAcc(parseInt(firstChild.value));
            }
            addWithCarry(storageLocation);
        }
        add(node);
        storeAcc(key);
    } else { // variable assignment
        var valueVarKey = getVariableKey(value, scope);
        loadAccMem(valueVarKey);
        storeAcc(key);
    }
}

var genPrint = function(node, scope) {
    var child = node.children[0];
    var value = child.value;
    if (value.substr(0,1) === '\"') { // String
        var stringValue = value.substr(1, value.length - 2);
        var stringLocation = getStringLocation(stringValue, scope);
        loadXConstant(2);
        loadYMem(stringLocation);
    } else if (!isNaN(parseInt(value))) { // Number
        var num = parseInt(value);
        var key = getVariableKey(value, scope);
        loadAcc(num);
        storeAcc(key);
        loadXConstant(1);
        loadYMem(key);
    } else if (value === '==') { // Boolean Expression
        // Not recursive
        var firstChild = child.children[0];
        var secondChild = child.children[1];
        var sndKey;
        if(isNaN(parseInt(firstChild.value))) { // variable
            var fcKey = getVariableKey(firstChild.value, scope);
            loadXMem(fcKey);
        } else { // Constant
            loadXConstant(parseInt(firstChild.value));
        }
        if(isNaN(parseInt(secondChild.value))) { // variable
            sndKey = getVariableKey(secondChild.value, scope);
        } else { // Constant
            loadAcc(parseInt(secondChild.value));
            sndKey = getVariableKey(secondChild.value, scope);
            storeAcc(sndKey);
        }
        var jumpId = 'J' + CodeGen.jumpNum;

        loadYConstant(0)
        compareXToMem(sndKey);
        branchIfZFlag(CodeGen.jumpNum++);

        var beforeJumpLength = CodeGen.code.length;

        loadYConstant(1);

        var afterJumpLength = CodeGen.code.length;
        CodeGen.jumpTable[jumpId] = afterJumpLength - beforeJumpLength;

        loadXConstant(1);
    } else if (value === '!=') {  // Boolean Expression
        // Not recursive
        var firstChild = child.children[0];
        var secondChild = child.children[1];
        var sndKey;
        if(isNaN(parseInt(firstChild.value))) { // variable
            var fcKey = getVariableKey(firstChild.value, scope);
            loadXMem(fcKey);
        } else { // Constant
            loadXConstant(parseInt(firstChild.value));
        }
        if(isNaN(parseInt(secondChild.value))) { // variable
            sndKey = getVariableKey(secondChild.value, scope);
        } else { // Constant
            loadAcc(parseInt(secondChild.value));
            sndKey = getVariableKey(secondChild.value, scope);
            storeAcc(sndKey);
        }
        var jumpId = 'J' + CodeGen.jumpNum;

        loadYConstant(1)
        compareXToMem(sndKey);
        branchIfZFlag(CodeGen.jumpNum++);

        var beforeJumpLength = CodeGen.code.length;

        loadYConstant(0);

        var afterJumpLength = CodeGen.code.length;
        CodeGen.jumpTable[jumpId] = afterJumpLength - beforeJumpLength;

        loadXConstant(1);// Boolean Expression
    } else if (value === '+') { // Addition
        assignVariableKey('+', 1);
        var storageLocation = CodeGen.staticTable['+' + 1];
        var add = function(node){
            var firstChild = node.children[0];
            var secondChild = node.children[1];
            if(secondChild.value === '+'){
                add(secondChild);
            } else {
                if (isNaN(parseInt(secondChild.value))) { // Variable
                    loadAccMem(getVariableKey(secondChild.value, scope));
                } else { // Int
                    loadAcc(parseInt(secondChild.value));
                }
                storeAcc(storageLocation);
            }
            if (isNaN(parseInt(firstChild.value))) { // Variable TODO Account for strings
                loadAccMem(getVariableKey(firstChild.value, scope));
            } else { // Int
                loadAcc(parseInt(firstChild.value));
            }
            addWithCarry(storageLocation);
            storeAcc(storageLocation);
        }
        add(node.children[0]);
        loadYMem(storageLocation);
        loadXConstant(1);
    } else if (value === 'false') { // Boolean Literal
        loadXConstant(1);
        loadYConstant(0);
    } else if (value === 'true') { // Boolean Literal
        loadXConstant(1);
        loadYConstant(1);
    } else { // Variable TODO Account for strings
        // console.log(scope);
    }
    sysCall();
}

var genIf = function(node, scope) {
    // TODO
}

var genWhile = function(node, scope) {
    // TODO 
}


var loadAccMem    = function(addr) { addrCommand('AD', addr); }
var storeAcc      = function(addr) { addrCommand('8D', addr); }
var addWithCarry  = function(addr) { addrCommand('6D', addr); }
var loadXMem      = function(addr) { addrCommand('AE', addr); }
var loadYMem      = function(addr) { addrCommand('AC', addr); }
var compareXToMem = function(addr) { addrCommand('EC', addr); }
var incrementByte = function(addr) { addrCommand('EE', addr); }

var loadXConstant = function(constant) { constCommand('A2', constant); }
var loadYConstant = function(constant) { constCommand('A0', constant); }
var loadAcc       = function(constant) { constCommand('A9', constant); }

var sysCall       = function() { CodeGen.code.push('FF'); }

var branchIfZFlag = function(jumpNum){
    CodeGen.code.push('D0');
    CodeGen.code.push('J' + jumpNum);
}

// Utilities
var variableTypeLookup = function (name, scope) {
    var info = CodeGen.symbolTable[scope.num + name];
    while (info === undefined && scope !== null) {
        info = CodeGen.symbolTable[scope.num + name];
        scope = scope.parent;
    }
    if (info === undefined) { return undefined; }
    return info.type;
}

var getStringLocation = function (value, scope) {
    var newScope = scope;
    var key = CodeGen.staticTable[value + scope.num];
    while(key === undefined){
        newScope = newScope.parent;
        var key = CodeGen.staticTable[value + newScope.num];
        if(newScope.parent === null){
            break;
        }
    }
    if (key === undefined){ // Add the string to the end of the output
        CodeGen.endBytes.unshift('00'); // 00 is the terminator for the string
        for (var i = 0; i < value.length; i++){
            var character = value[i];
            CodeGen.endBytes.unshift(characterToHex(character));
        }
        CodeGen.staticTable[value + scope.num] = 256 - CodeGen.endBytes.length;
        // console.log(CodeGen.staticTable[value + scope.num]);
        key = CodeGen.staticTable[value + scope.num];
    }
    return key;
}

var getVariableKey = function (name, scope) {
    var num = scope.num;
    var newScope = scope;
    while(key === undefined){
        newScope = newScope.parent;
        var key = CodeGen.staticTable[name + newScope.num];
        if(newScope.parent === null){
            break;
        }
    }
    var key = CodeGen.staticTable[name + num];
    if (key === undefined) {
        assignVariableKey(name, num);
        var key = CodeGen.staticTable[name + num];
    }
    return key;
}
var assignVariableKey = function (varName, scopeNum) {
    CodeGen.staticTable[varName + scopeNum] = 'T' + CodeGen.variableKeyNumber++;
}
var addrCommand = function(cmd, addr){
    CodeGen.code.push(cmd);
    CodeGen.code.push(addr.charAt(0) + addr.charAt(1));
    // CodeGen.code.push(addr.charAt(2) + addr.charAt(3)); // Always '00' anyways
    CodeGen.code.push('00'); // So the address doesn't have have to be in a extra format that is meaningless
}
var constCommand = function(cmd, constant){
    var add = intToHex(constant);
    if(isNaN(add)){
        add = constant;
    }
    CodeGen.code.push(cmd);
    CodeGen.code.push(hexToByte(add));
}
var characterToHex = function(character){
    return character.charCodeAt(0) + '';
}
var hexToByte = function(hex){
    if (hex.length === 1){
        return '0' + hex;
    }
    return '' + hex;
}
var intToHex = function(integer){
    if (integer < 16){
        return '0' + integer.toString(16); 
    }
    return integer.toString(16);
}
var hexToInt = function(hexString){
    return parseInt(hexString, 16);
}
var incrementHex = function(hex){
    var i = parseInt(hex, 16);
    return (i + 1).toString(16);
}
