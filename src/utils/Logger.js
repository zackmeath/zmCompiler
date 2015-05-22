function Logger(){

};
var treeOut = $("#TreeTA");
var tokenOut = $("#Tokens");
var output = $("#output");

//keep track of checkbox status
Logger.verbose = false;

Logger.lex = function(line){
	if(Logger.verbose){
		tokenOut.val(tokenOut.val() + line + "\n");
	}
}
Logger.parse = function(line){
	if(Logger.verbose) {
		tokenOut.val(tokenOut.val() + line + "\n");
	}
}
//overwrite verbose restriction (this is important stuff!)
Logger.parseWarning = function(line){
	tokenOut.val(tokenOut.val() + line + "\n");
}

Logger.semanticWarning = function(line){
	tokenOut.val(tokenOut.val() + line + "\n");
}
Logger.semanticLog = function(line){
	if(Logger.verbose) {
		tokenOut.val(tokenOut.val() + line + "\n");
	}
}
Logger.codeGenWarning = function(line){
	tokenOut.val(tokenOut.val() + line + "\n");
}
Logger.codeGenLog = function(line){
	if(Logger.verbose) {
		tokenOut.val(tokenOut.val() + line + "\n");
	}
}
Logger.writeMachineCode = function(code, heap){
	output.val('');
	var space = 255 - heap.length;
	for (var i = 0; i <= space; i++){
		if (code[i]){
			output.val(output.val() + code[i].toUpperCase() + ' ');
		} else {
			output.val(output.val() + '00' + ' ');
		}
	}
	for (var i = 0; i < heap.length; i++){
		output.val(output.val() + heap[i] + ' ')
	}
}

Logger.displayTree = function(tree){
	$('#tree1').tree('destroy');
	var displayTree = [];
	displayTree.push({
		label: tree.root.value,
		children: [],
	});
	var addChild = function(node, toAdd){
		var adding = {
			label: toAdd.value,
			children: [],
		}
		toAdd.children.forEach(function(child){
			addChild(adding, child);
		});
		node.children.push(adding);
	}
	tree.root.children.forEach(function(child){
		addChild(displayTree[0], child);
	});
	

	$('#tree1').tree({
	    data: displayTree,
	    autoOpen: 8,
	    closedIcon: '+',
	    openedIcon: '-',
	});
	$('#tree1').tree('reload');


}