function SemanticAnalyser(){

};
SemanticAnalyser.ast = undefined;
SemanticAnalyser.symbolTable = {};
SemanticAnalyser.currentScope = undefined;
SemanticAnalyser.lastScope = undefined;
SemanticAnalyser.scopeNum = 0;
SemanticAnalyser.generateAST = function(cst){
	SemanticAnalyser.lastScope = undefined;
	SemanticAnalyser.ast = new Tree();
	SemanticAnalyser.symbolTable = {};
	// SemanticAnalyser.ast.addBranchNode('{}');

	var traverseCST = function(node){
		var returnToParent = true;
		var ignore = {
			'{': true,
			'}': true,
			'(': true,
			')': true,
			'=': true,
			'==': true,
			'!=': true,
			'while': true,
			'print': true,
			'if': true,
			'+': true,
			'Digit': true,
			'BoolValue': true,
			'false': true,
			'true': true,
		}
		var val = node.value;
		if (val === 'Block'){
			SemanticAnalyser.ast.addBranchNode('{}');
		} else if(val === 'VarDecl'){
			SemanticAnalyser.ast.addBranchNode(val);
		} else if(val === 'Assignment'){
			SemanticAnalyser.ast.addBranchNode(node.children[1].value, node.children[1].token);
		} else if(val === 'Print'){
			SemanticAnalyser.ast.addBranchNode(node.children[0].value, node.children[0].token);
		} else if(val === 'While'){
			SemanticAnalyser.ast.addBranchNode(node.children[0].value, node.children[0].token);
		} else if(val === 'If'){
			SemanticAnalyser.ast.addBranchNode(node.value, node.token);
		} else if(val === 'IntExpr'){
			if (node.children.length > 1){
				SemanticAnalyser.ast.addBranchNode(node.children[1].children[0].value, node.children[1].children[0].token);
			} else if (node.children.length === 1){
				//SemanticAnalyser.ast.addLeafNode(node.children[0].children[0].value, node.children[0].children[0]);
				returnToParent = false;
			}
		} else if(val === 'BooleanExpr'){
			if(node.children[0].value === '('){
				SemanticAnalyser.ast.addBranchNode(node.children[2].children[0].value, node.children[2].children[0].token);
			} else{
				SemanticAnalyser.ast.addLeafNode(node.children[0].children[0].value, node.children[0]);
				returnToParent = false;
			}
		} else if(val === 'StringExpr') {
			SemanticAnalyser.ast.addLeafNode(node.children[0].value);
			returnToParent = false;
		} else if (val === 'Digit'){
			//ignore
			returnToParent = false;
		} else if(node.token !== undefined && node.token !== null && (!ignore[node.value])) {
			SemanticAnalyser.ast.addLeafNode(node.token);
			returnToParent = false;
		} else {
			returnToParent = false;
		}
		node.children.forEach(function(child){
			traverseCST(child);
		});
		if(returnToParent){
			SemanticAnalyser.ast.returnToParent();
		}
	}
	traverseCST(cst.root.children[0]);
}
SemanticAnalyser.analyze = function(){
	Logger.semanticLog('\n\nStarting Semantic Analysis...');
	SemanticAnalyser.currentScope = undefined;
	SemanticAnalyser.scopeNum = 0;
	SemanticAnalyser.check(SemanticAnalyser.ast.root);
}
SemanticAnalyser.check = function(node){
	if (node.value === '{}'){
		Logger.semanticLog('Found block, creating new scope(' + SemanticAnalyser.scopeNum +')...');
		if (SemanticAnalyser.currentScope === undefined){
			var adding = new Scope(SemanticAnalyser.scopeNum)
			SemanticAnalyser.currentScope = adding;
		} else {
			var newScope = new Scope(SemanticAnalyser.scopeNum);
			newScope.setParent(SemanticAnalyser.currentScope);
			SemanticAnalyser.currentScope.addChild(newScope);
			SemanticAnalyser.currentScope = newScope;
		}
		SemanticAnalyser.scopeNum++;

		node.children.forEach(function(child){
			SemanticAnalyser.check(child);
		});
		SemanticAnalyser.lastScope = SemanticAnalyser.currentScope;
		SemanticAnalyser.currentScope = SemanticAnalyser.currentScope.parent;
	} else if (node.value === 'VarDecl'){
		Logger.semanticLog('Found VarDecl...');
		var varType = node.children[0];
		var id = node.children[1];
		if (SemanticAnalyser.currentScope.vars[id.value] !== undefined){
			if (SemanticAnalyser.currentScope.vars[id.value].type === varType.value){
				Logger.semanticWarning('WARNING: Multiple declarations of ID \'' + id.value + '\' in the same scope');
			} else {
				Error.generateSemantic('ID \'' + id.value + '\' declared with multiple types in the same scope');
			}
		} else {
			Logger.semanticLog('Inserting variable \'' + id.value + '\' into symbol table...');
			SemanticAnalyser.symbolTable
			SemanticAnalyser.currentScope.vars[id.value] = {
															id: id.value,
															type: varType.value, 
															value: undefined, //initialize with something?
															used: false
															}
		}
	} else if (node.value === '='){
		Logger.semanticLog('Found Assignment, checking types...');
		var variable = node.children[0];
		var value = node.children[1];
		var valueType = getExprType(value);
		var varType = varTypeLookup(variable.value);
		if (valueType !== varType){
			Error.generateSemantic('Assignment to variable \'' + variable.value + 
				'\' is the incorrect type, should be type \'' + varType + '\'');
		} else {
			Logger.semanticLog('\tMatching types');
		}
	} else if (node.value === '==' || node.value === '!='){
		Logger.semanticLog('Found BoolOp, checking types...');
		var left = node.children[0];
		var right = node.children[1];
		var leftType = getExprType(left);
		var rightType = getExprType(right);
		if (leftType !== rightType){
			Error.generateSemantic('Comparison operator cannot compare type \'' + 
				leftType + '\' with type \'' + rightType + '\'');
		} else {
			Logger.semanticLog('\tMatching types');
		}
	} else {
		node.children.forEach(function(child){
			SemanticAnalyser.check(child);
		});
	}
}
getExprType = function(node){
	var value = node.value;
	Logger.semanticLog('Evaluating type of ' + value);
	var nums = {'1':true,'2':true,'3':true,'4':true,'5':true,'6':true,'7':true,'8':true,'9':true,'0':true};
	if (value.charAt(0) === '\"'){
		return 'string';
	} else if(nums[value]){
		return 'int';
	} else if(value === 'false' || value === 'true'){
		return 'boolean';
	} else if(value === '+'){
		var first = getExprType(node.children[0]);
		var second = getExprType(node.children[1]);
		if (first === second){
			return first;
		} else {
			Error.generateSemantic('Addition operator can not handle types \'' + first + 
				'\' and \'' + second + '\'');
			return null;
		}
	} else if(value === '==' || value === '!='){
		var first = getExprType(node.children[0]);
		var second = getExprType(node.children[1]);
		if (first === second){
			return first;
		} else {
			Error.generateSemantic('Boolean operator \'' + value + '\' can not handle types \'' 
				+ first + '\' and \'' + second);
			return null;
		}
	} else if(value.length === 1){
		SemanticAnalyser.currentScope.vars[value].used = true;
		return varTypeLookup(value);
	} else { 
		console.log('We messed up in getExprType');
		return null;
	}
}
varTypeLookup = function(variable){
	Logger.semanticLog('Retrieving type of \'' + variable + '\' from symbol table');
	var scope = SemanticAnalyser.currentScope;
	while (scope.vars[variable] === undefined){
		if (scope.parent === null || scope.parent === undefined){
			Error.generateSemantic('Variable\'' + variable + '\' is not defined in the current scope or any parent scope');
			break;
			//error, var is not defined in its current scope or a parent scope
		} else {
			scope = scope.parent;
		}
	}
	if (scope.vars[variable] !== undefined){
		return scope.vars[variable].type;
	} else {
		return undefined;
	}
}
varValueLookup = function(variable){
	var scope = SemanticAnalyser.currentScope;
	while (scope.vars[variable] === undefined){
		if (scope.parent === null || scope.parent === undefined){
			Error.generateSemantic('Variable\'' + variable + '\' is not defined in the current scope or any parent scope');
			break;
		} else {
			scope = scope.parent;
		}
	}
	if (scope.vars[variable] !== undefined){
		//scope.vars[variable].used = true;
		return scope.vars[variable].value;
	} else {
		return undefined;
	}
}
SemanticAnalyser.buildSymbolTable = function(){
	var parentScope = SemanticAnalyser.lastScope;

	var processScope = function(scope){
		Object.keys(scope.vars).forEach(function(variable){
			SemanticAnalyser.symbolTable[scope.num + variable] = scope.vars[variable];
		});
		scope.children.forEach(function(child){
			processScope(child);
		});
	}
	processScope(parentScope);
}

SemanticAnalyser.displaySymbolTable = function(){
	Logger.semanticWarning('\nSymbol Table:');
	Logger.semanticWarning('Scope  ID   Type');
	Object.keys(SemanticAnalyser.symbolTable).forEach(function(entry){
		Logger.semanticWarning('  ' + entry.charAt(0) + '     ' + SemanticAnalyser.symbolTable[entry].id +
		 '    ' + SemanticAnalyser.symbolTable[entry].type);
	});
}













