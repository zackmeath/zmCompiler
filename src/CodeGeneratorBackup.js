function CodeGen(){

}
CodeGen.staticTable = {};
CodeGen.jumpTable = {};
CodeGen.generateCode = function(ast){

    //reset
    CodeGen.quickVarReference = {};
    CodeGen.staticTable = {};
    CodeGen.stringInfo = {};
    CodeGen.jumpTable = {};
    CodeGen.code = [];
    CodeGen.endBytesUsed = [];
    CodeGen.jumpStart = -1;
    CodeGen.jumpNum = 0;
    CodeGen.parentScope = SemanticAnalyser.lastScope;
    var scopeNum = -1;
    var varNum = 0;
    //reset

    Logger.warning('\nStarting Code Generation...');

    var processNode = function(node){
        var exitScope = false;
        var endIf = false;
        var genChildren = true;
        var jumpNum = -1;
        if (node.value === '{}'){
            //new scope
            exitScope = true;
            scopeNum++;
        } else if(node.value === '='){
            genAssignment(node, scopeNum);
        } else if (node.value === 'print'){
            genPrint(node, scopeNum);
            genChildren = false;
        } else if (node.value === 'VarDecl'){
            genVarDecl(node, scopeNum, varNum);
            varNum++;
            genChildren = false;
        } else if(node.value === 'If'){
            //start keeping track of a jump
            jumpNum = CodeGen.jumpNum;
            endIf = true;
            genChildren = genIf(node, scopeNum);
        } else if(node.value === 'while'){
            //start keeping track of a jump
            endIf = true;
            genChildren = genWhile(node, scopeNum);
        } else {
            //no other cases
        }

        if (genChildren){
            node.children.forEach(function(child){
                processNode(child);
            });
        }

        if (exitScope){
            scopeNum--;
        }
        if (endIf){
            if (jumpNum === -1){
                //error jump not set
            } else {
                //replace J with number of bytes from jumpstart
                var jumpLength = intToHex(CodeGen.code.length - CodeGen.jumpTable[jumpNum]);
                for(var i = 0; i < CodeGen.code.length; i++){
                    if (CodeGen.code[i] === 'J' + jumpNum){
                        if (jumpLength.length === 1){
                            CodeGen.code[i] = '0' + jumpLength;
                        } else {
                            CodeGen.code[i] = jumpLength;
                        }
                    }
                }
                CodeGen.jumpStart = -1
            }
        }
    }
    processNode(ast.root);
    CodeGen.backpatch();
    var result = Logger.writeMachineCode(CodeGen.code, CodeGen.endBytesUsed);
    return result;
}

CodeGen.backpatch = function(){
    var byteLocation = CodeGen.code.length + 1;
    Object.keys(CodeGen.staticTable).forEach(function(varKey){
        var replaceThis = CodeGen.staticTable[varKey].substring(0, 2);
        var withThis = intToHex(byteLocation);
        if (withThis.length === 1){
            withThis = '0' + withThis;
        }
        for(var i = 0; i < CodeGen.code.length; i++){
            if (CodeGen.code[i] === replaceThis){
                CodeGen.code[i] = withThis;
            }
        }
        byteLocation++;
    });
}

genIf = function(node, scopeNum){
    var boolExpr = node.children[0].value;
    if (boolExpr === 'false' || boolExpr === 'true'){
        if(boolExpr === 'true'){
            return true;
        } else {
            return false;
        }
    } else if (boolExpr === '==' || boolExpr === '!='){
        genBoolExpr(node, scopeNum, false);
        return true;
    } 
}

genWhile = function(node, scopeNum){
    var boolExpr = node.children[0].value;
    if (CodeGen.staticTable[scopeNum + boolExpr] !== undefined){
        //get from variable
    } else if (boolExpr === 'false' || boolExpr === 'true'){
        if(boolExpr === 'true'){
            return true;
        } else {
            return false;
        }
    } else if (boolExpr === '==' || boolExpr === '!='){
        genBoolExpr(node, scopeNum, true);
        return true
    }
}

genBoolExpr = function(node, scopeNum, loop){
    if(loop){
        //while
    } else {
        //if
        if (node.children[0].value === '=='){
            if (varLookup(node.children[0].children[0].value, scopeNum)){
                loadXMem(CodeGen.staticTable[scopeNum + node.children[0].children[0].value]);
                if (varLookup(node.children[0].children[1].value, scopeNum)){
                    compareXToMem(CodeGen.staticTable[scopeNum + node.children[0].children[1].value])
                } else {
                    //constant
                    CodeGen.staticTable[scopeNum + node.children[0].children[1].value] = 'ct00';
                    if (varLookup(node.children[0].children[0].value, scopeNum).type === 'int'){
                        loadAcc(node.children[0].children[1].value);
                    } else if(node.children[0].children[1].value === 'true'){
                        loadAcc(1);
                    } else if(node.children[0].children[1].value === 'false'){
                        loadAcc(0);
                    } else if(varLookup(node.children[0].children[0], scopeNum).type === 'string'){
                        var arr = [];
                        for (var i = 1; i < node.children[0].children[1].value.length - 1; i++){
                            arr.push(intToHex( node.children[0].children[1].value.charCodeAt(i) ));
                        }
                        arr.push("00");
                        for(var i = arr.length-1; i >= 0; i--){
                            CodeGen.endBytesUsed.unshift(arr[i]);
                        }
                        loadAcc(intToHex(parseInt(getHeapStartLocation(), 16) + 1));
                    }
                    storeAcc('ct00')
                        loadXMem('ct00');
                    compareXToMem(CodeGen.staticTable[scopeNum + node.children[0].children[0].value]);
                    branchIfZFlag(CodeGen.jumpNum);
                    CodeGen.jumpNum++;
                    CodeGen.jumpTable[CodeGen.jumpNum-1] = CodeGen.code.length;
                }
            }
        } else if(node.children[0].value = '!='){
            //flip flag once its done

        }
    }
}

genVarDecl = function(node, scopeNum, varNum){
    var variable = node.children[1].value;
    if (CodeGen.staticTable[scopeNum + variable] === undefined){
        if (varLookup(node.children[1].value, scopeNum).type === 'int'){
            CodeGen.staticTable[scopeNum + variable] = 'T' + varNum + '00';
            loadAcc(0);
            storeAcc(CodeGen.staticTable[scopeNum + variable]);
        } else if(varLookup(variable, scopeNum).type === 'string'){
            CodeGen.staticTable[scopeNum + variable] = 'T' + varNum + '00';
            CodeGen.stringInfo[scopeNum + variable] = newStringInfo(getHeapStartLocation(), 0);
        } else if (varLookup(variable, scopeNum).type === 'boolean'){
            CodeGen.staticTable[scopeNum + variable] = 'T' + varNum + '00';
            loadAcc(1);
            storeAcc(CodeGen.staticTable[scopeNum + variable]);
        }
    } else {
        //it was already declared somewhere
    }
}
genPrint = function(node, scopeNum){
    var nums = {'1':true,'2':true,'3':true,'4':true,'5':true,'6':true,'7':true,'8':true,'9':true,'0':true};
    var variable = node.children[0].value;
    if (CodeGen.staticTable[scopeNum + variable] === undefined){
        if (variable.charAt(0) == '\"'){
            CodeGen.staticTable[scopeNum + variable] = 'pv00';
            var arr = [];
            for (var i = 1; i < node.children[0].value.length - 1; i++){
                arr.push(intToHex( node.children[0].value.charCodeAt(i) ));
            }
            arr.push("00");
            for(var i = arr.length-1; i >= 0; i--){
                CodeGen.endBytesUsed.unshift(arr[i]);
            }

            loadAccMem(incrementHex(getHeapStartLocation()));
            loadYConstant(incrementHex(getHeapStartLocation()));
            storeAcc(CodeGen.staticTable[scopeNum + variable]);
            loadXConstant(2);
        } else if(variable === '=='){
            //print bool expr

        } else if(variable === '!='){
            // print bool expr

        } else if(variable === 'false' || variable === 'true'){
            loadXConstant(1);
            if(variable === 'false'){
                loadYConstant(0);
            } else {
                loadYConstant(1);
            }
        } else if (nums[variable]){
            loadXConstant(1);
            loadYConstant(variable);
        } else if (variable === '+'){
            loadXConstant(1);
            //recursively or iterively do +
            //while child[1] === +
        }
    } else {
        if (varLookup(variable, scopeNum).type === 'int'){
            loadYMem(CodeGen.staticTable[scopeNum + variable]);
            loadXConstant(1);
        } else if (varLookup(variable, scopeNum).type === 'string'){
            loadYMem(CodeGen.staticTable[scopeNum + variable]);
            loadXConstant(2);
        } else if (varLookup(variable, scopeNum).type === 'boolean'){
            loadYMem(CodeGen.staticTable[scopeNum + variable]);
            loadXConstant(1);
        } else {
            //wtf
            console.log('should never happen: print variable');
        }
    }

    sysCall();
}
genAssignment = function(node, scopeNum){
    var variable = node.children[0].value;
    var nums = {'1':true,'2':true,'3':true,'4':true,'5':true,'6':true,'7':true,'8':true,'9':true,'0':true};
    if (CodeGen.staticTable[scopeNum + node.children[1].value] !== undefined){
        //load from another variable
        if (varLookup(node.children[1].value, scopeNum).type === 'int'){
            //retrieve from other int var
        } else if(varLookup(node.children[1].value, scopeNum).type === 'string'){
            //get from string var
        } else {
            //boolvar
        }
    } else if (varLookup(node.children[0].value, scopeNum).type === 'int'){
        if(nums[node.children[1].value]){
            loadAcc(parseInt(node.children[1].value));
            storeAcc(CodeGen.staticTable[scopeNum + variable]);
            var temp = varLookup(node.children[0].value, scopeNum);
            temp.value = node.children[1].value;
            CodeGen.quickVarReference[node.children[0].value + scopeNum] = parseInt(node.children[1].value);
        } else {
            var getAdditionValue = function(node){
                var sum = 0;
                while(node.children[1].value === '+'){
                    node = node.children[1];
                    sum += parseInt(node.children[0].value);
                    if(nums[node.children[1].value]){
                        sum += parseInt(node.children[1].value);
                    } else if (node.children[1].value !== '+' ){
                        sum += parseInt(varLookup(node.children[1].value, scopeNum).value);
                    }
                }
                return sum;
            }
            var num = getAdditionValue(node);
            loadAcc(num);
            storeAcc(CodeGen.staticTable[scopeNum + variable]);
            CodeGen.quickVarReference[node.children[0].value + scopeNum] = num;
        }

    } else if(varLookup(node.children[0].value, scopeNum).type === 'string'){
        if (node.children[1].value.charAt(0) === '\"') {
            //load from string literal
            var str = '';
            var arr = [];
            for (var i = 1; i < node.children[1].value.length - 1; i++){
                arr.push(intToHex( node.children[1].value.charCodeAt(i) ));
                str += node.children[1].value.charAt(i);
            }
            arr.push("00");
            for(var i = arr.length-1; i >= 0; i--){
                CodeGen.endBytesUsed.unshift(arr[i]);
            }
            loadAcc(intToHex(parseInt(getHeapStartLocation(), 16) + 1));
            storeAcc(CodeGen.staticTable[scopeNum + variable]);
            CodeGen.stringInfo[scopeNum, node.children[0].value] = newStringInfo(getHeapStartLocation(), arr.length-1);
            CodeGen.quickVarReference[node.children[0].value + scopeNum] = parseInt(node.children[1].value);
        } else {
            //error
            console.log('should never happen: string assignment');
        }
    } else if(varLookup(node.children[0].value, scopeNum).type === 'boolean'){
        if (node.children[1].value === 'false' || node.children[1].value === 'true'){
            if (node.children[1].value === 'true'){
                loadAcc(1);
            } else {
                loadAcc(0);
            }
            storeAcc(CodeGen.staticTable[scopeNum + variable])
        } else if (node.children[1].value === '==' || node.children[1].value === '!='){
            //load from expression
        } else {
            //error
            console.log('should never happen: boolean assignment');
        }
    }
}

varLookup = function(variable, scopeNum){
    if (typeof variable === 'object'){
        variable = variable.value;
    }
    var currentScope = getScopeByNum(scopeNum);
    while (currentScope.vars[variable] === undefined){
        if (currentScope['parent'] === undefined){
            console.log('Unable to find reference to variable: ' + variable);
            break;
        }
        currentScope = currentScope['parent'];
        if (currentScope === undefined || currentScope === null || currentScope.num === undefined){
            return undefined;
        }
    }
    return currentScope.vars[variable];
}

loadAcc = function(num){
    var add = intToHex(num);
    CodeGen.code.push('A9');
    if (add.length === 1) {
        CodeGen.code.push('0' + add);
    } else {
        CodeGen.code.push('' + add);
    }

}
loadAccMem = function(addr){
    CodeGen.code.push('AD');
    CodeGen.code.push(addr.charAt(0) + addr.charAt(1));
    CodeGen.code.push(addr.charAt(2) + addr.charAt(3));
}
storeAcc = function(addr){
    CodeGen.code.push('8D');
    CodeGen.code.push(addr.charAt(0) + addr.charAt(1));
    CodeGen.code.push(addr.charAt(2) + addr.charAt(3));
}
addWithCarry = function(addr){ // takes acc value and adds it to val in mem then stores in acc
    //6D + binary(0010 ----> 10 00)
    CodeGen.code.push('6D');
    CodeGen.code.push(addr.charAt(0) + addr.charAt(1));
    CodeGen.code.push(addr.charAt(2) + addr.charAt(3));
}
loadXConstant = function(constant){
    var add = intToHex(constant);
    if (add.length === 1) {
        CodeGen.code.push('A2');
        CodeGen.code.push('0' + add);
    } else {
        CodeGen.code.push('A2');
        CodeGen.code.push('' + add);
    }
}
loadXMem = function(addr){
    //AE + binary(0010 ----> 10 00)
    CodeGen.code.push('AE');
    CodeGen.code.push(addr.charAt(0) + addr.charAt(1));
    CodeGen.code.push(addr.charAt(2) + addr.charAt(3));
}
loadYConstant = function(constant){
    var add = intToHex(constant);
    if (add.length === 1) {
        CodeGen.code.push('A0');
        CodeGen.code.push('0' + add);
    } else {
        CodeGen.code.push('A0');
        CodeGen.code.push('' + add);
    }
    //A0 + constant(04)
}
loadYMem = function(addr){
    //AC + binary(0010 ----> 10 00)
    CodeGen.code.push('AC');
    CodeGen.code.push(addr.charAt(0) + addr.charAt(1));
    CodeGen.code.push(addr.charAt(2) + addr.charAt(3));
}
end = function(){ // may not need for code gen
    //EA 00
    CodeGen.code.push('EA');
    CodeGen.code.push('00');
}
compareXToMem = function(addr){ // sets the z (zero) flag if equal
    //EC + binary(0010 ----> 10 00)
    CodeGen.code.push('EC');
    CodeGen.code.push(addr.charAt(0) + addr.charAt(1));
    CodeGen.code.push(addr.charAt(2) + addr.charAt(3));
}
branchIfZFlag = function(jumpNum){
    //D0 + bytes(EF)
    CodeGen.code.push('D0');
    CodeGen.code.push('J' + jumpNum);
}
incrementByte = function(addr){
    //EE + byte(binary(0010 ----> 10 00))
    CodeGen.code.push('EE');
    CodeGen.code.push(addr.charAt(0) + addr.charAt(1));
    CodeGen.code.push(addr.charAt(2) + addr.charAt(3));
}
sysCall = function(){
    //FF
    CodeGen.code.push('FF');
}

getScopeByNum = function(integer){
    var traverseScopes = function(scopeNode){
        if(scopeNode.num === integer) { // Found a match!
            return scopeNode;
        } else {
            if(scopeNode.children !== undefined && scopeNode.children !== null){
                var children = scopeNode.children;
                for(var i = 0; i < children.length; i++){
                    var result = traverseScopes(children[i]);
                    if(result !== undefined){
                        return result;
                    }
                }
                return undefined;
            }
        }
    };
    return traverseScopes(CodeGen.parentScope);
}

newStringInfo = function(location, size){
    return {location: location, size: size};
}

intToHex = function(integer){
    if (integer < 16){
        return '0' + integer.toString(16); 
    }
    return integer.toString(16);
}
hexToInt = function(hexString){
    return parseInt(hexString, 16);
}
getHeapStartLocation = function(){
    return intToHex(255 - CodeGen.endBytesUsed.length);
}
incrementHex = function(hex){
    var i = parseInt(hex, 16);
    return (i + 1).toString(16);
}
evaluateBooleanExpr = function(node, scopeNum){
    //eval boolexpr
}
