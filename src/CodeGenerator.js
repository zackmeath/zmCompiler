function CodeGen(){

}
CodeGen.staticTable = {};
CodeGen.jumpTable = {};

CodeGen.generateCode = function(ast){

    // Reset CodeGen
    CodeGen.staticTable = {};                         // Table for variable location references
    CodeGen.jumpTable   = {};                         // Keeps track of jump distances
    CodeGen.code        = [];                         // Array of bytes that represent the code generated
    CodeGen.endBytes    = [];                         // Array of bytes to be appended at the end of the program
    CodeGen.jumpNum     = 0;                          // Tracks the current jump reference for jump table
    CodeGen.parentScope = SemanticAnalyser.lastScope; // References the outermost scope
    CodeGen.variableKeyNumber = 0;

    Logger.warning('\nStarting Code Generation...');

    generateCode(ast);
    CodeGen.backpatch();
    var result = Logger.writeMachineCode(CodeGen.code, CodeGen.endBytes);
    return result;
}

CodeGen.backpatch = function(){
    // TODO Create variable references via the static table to allow a location for each variable
    // TODO Traverse the CodeGen.code array and replace all references with real location
    // TODO While traversing, also fill in jump table values
}

var generateCode = function(ast){

    var scopeRoot    = {num: 0, parent: null, children: []};
    var nextScope    = 1;
    var currentScope = scopeRoot;

    var evaluateNode = function(node, currentScopeNumber){
        var exitScope = false;
        var endIf     = false;
        var endWhile  = false;
        var jumpKey = 'J' + CodeGen.jumpNum;
        var genChildren = false;

        if (node.value === '{}'){
            exitScope = true;
            currentScope.children.push({num: nextScope++, parent: currentScope, children:[]});
            currentScope = currentScope.children[currentScope.children.length - 1];
            genChildren = true;
        } else if(node.value === '='){
            genAssignment(node, currentScope.num);
        } else if (node.value === 'print'){
            genPrint(node, currentScope.num);
        } else if (node.value === 'VarDecl'){
            genVarDecl(node, currentScope.num);
        } else if(node.value === 'If'){
            endIf = true;
            CodeGen.jumpNum++;
            // TODO Only generate 2nd child
            genChildren = genIf(node, currentScope.num);
        } else if(node.value === 'while'){
            CodeGen.jumpNum++;
            endIf = true;
            // TODO Only generate 2nd child
            genChildren = genWhile(node, currentScope.num);
        } else {
            // No other cases
        }

        var previousCodeLength = CodeGen.code.length;

        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            evaluateNode(child, currentScope.num);
        }

        var currentCodeLength = CodeGen.code.length;
        var jumpLength = (currentCodeLength - previousCodeLength) - 1; // TODO figure out what 1 is supposed to be (makes up for if statement codes etc)
        if (endIf) {
            CodeGen.jumpTable[jumpKey] = jumpLength;
        }
        if (endWhile) {
            CodeGen.jumpTable[jumpKey] = jumpLength;
        }
        if (exitScope) { currentScope = currentScope.parent; }

    }
    evaluateNode(ast.root, 0);
}

var genVarDecl = function(node, scopeNum) {
    var key = getVariableKey(node.children[1].value, scopeNum);
    loadAcc(0);
    storeAcc(key + '00');
}

var genAssignment = function(node, scopeNum) {
    var key = getVariableKey(node.children[0].value, scopeNum);
    var value = node.children[1].value;
    if(!isNaN(parseInt(value))) { // Number constant
        loadAcc(parseInt(value));
        storeAcc(key + '00');
    } else if (value.substr(0,1) === '\"') { // String constant
        var stringValue = value.substr(1, value.length - 2);
        var stringLocation = getStringLocation(stringValue, scopeNum);
        loadAcc(stringLocation);
        storeAcc(key + '00');
    } else if (value === '+') { // Addition
        assignVariableKey('+', 0);
        var storageLocation = CodeGen.staticTable['+' + 0];
        var add = function(node){
            var firstChild = node.children[0];
            var secondChild = node.children[1];
            if(secondChild.value === '+'){
                add(secondChild);
            } else {
                if (isNaN(parseInt(secondChild.value))) { // Variable
                    loadAccMem(getVariableKey(secondChild.value, scopeNum) + '00');
                } else { // Int
                    loadAcc(parseInt(secondChild.value));
                }
                storeAcc(storageLocation + '00');
            }
            if (isNaN(parseInt(firstChild.value))) { // Variable
                loadAccMem(getVariableKey(firstChild.value, scopeNum) + '00');
            } else { // Int
                loadAcc(parseInt(firstChild.value));
            }
            addWithCarry(storageLocation + '00');
        }
        add(node);
        storeAcc(key);
    } else { // It is a variable assignment
        var valueKey = getVariableKey(value, scopeNum);
        loadAccMem(valueKey + '00');
        storeAcc(key + '00');
    }
}

var genPrint = function(node, scopeNum) {
    var value = node.children[0].value;
    if (value.substr(0,1) === '\"') { // String
        var stringValue = value.substr(1, value.length - 2);
        var stringLocation = getStringLocation(stringValue, scopeNum);
        loadXConstant(2);
        loadYMem(stringLocation + '00');
    } else if (!isNaN(parseInt(value))) { // Number
        var num = parseInt(value);
        var key = getVariableKey('z', num);
        loadAcc(num);
        storeAcc(key + '00');
        loadXConstant(1);
        loadYMem(key + '00');
    } else if (value === '==') { // Boolean Expression
        // TODO
    } else if (value === '!=') { // Boolean Expression
        // TODO
    } else if (value === '+') { // Addition
        // TODO
    } else if (value === 'false') { // Boolean Literal
        // TODO
    } else if (value === 'true') { // Boolean Literal
        // TODO
    } else { // Variable
        // TODO
    }
    sysCall();
}

var genIf = function(node, scopeNum) {
    // TODO
}

var genWhile = function(node, scopeNum) {
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
var getStringLocation = function (value, scopeNum) {
    // TODO Account for variable reference in a sub-scope
    var key = CodeGen.staticTable[value + scopeNum];
    if (key === undefined){
        for (var i = 0; i < value.length; i++){
            var character = value[i];
            CodeGen.endBytes.unshift(characterToHex(character));
        }
        CodeGen.staticTable[value + scopeNum] = 256 - CodeGen.endBytes.length;
        console.log(CodeGen.staticTable[value + scopeNum]);
        key = CodeGen.staticTable[value + scopeNum];
        CodeGen.endBytes.unshift('00');
    }
    return key;
    // TODO
}
// TODO
var getVariableKey = function (name, scopeNum) {
    // TODO
    // TODO Account for variable reference in a sub-scope
    // // TODO
    var key = CodeGen.staticTable[name + scopeNum];
    // TODO
    if (key === undefined) {
        // TODO
        assignVariableKey(name, scopeNum);
        var key = CodeGen.staticTable[name + scopeNum];
    }
    return key;
}
var assignVariableKey = function (varName, scopeNum) {
    CodeGen.staticTable[varName + scopeNum] = 'T' + CodeGen.variableKeyNumber++;
}
var addrCommand = function(cmd, addr){
    CodeGen.code.push(cmd);
    CodeGen.code.push(addr.charAt(0) + addr.charAt(1));
    CodeGen.code.push(addr.charAt(2) + addr.charAt(3));
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
