function TreeNode(value, token){
	this.value = value;
	this.token = token;
	this.parent = null;
	this.children = [];
	this.assignParent = function(parent){
		this.parent = parent;
	};
	this.addChild = function(child){
		this.children.push(child);
	}
}
function Tree(){
	this.root = null;
	this.current = {};
	this.addBranchNode = function(value, token){
		var toAdd = new TreeNode(value, token);
		if (this.root === null){
			this.root = toAdd;
		} else {
			toAdd.assignParent(this.current);
			this.current.addChild(toAdd);
		}
		this.current = toAdd;
	}
	this.addLeafNode = function(token){
		if (typeof token === 'object'){
			var toAdd = new TreeNode(token.value, token);
			toAdd.assignParent(this.current);
			this.current.addChild(toAdd);
		} else {
			var toAdd = new TreeNode(token);
			toAdd.assignParent(this.current);
			this.current.addChild(toAdd);
		}
			
	}
	this.returnToParent = function(){
		if(this.current === null){
			//we returned too high
			console.log('TOO MUCH RETURNING UP THE TREE: ');
		} else {
			if (this.current.parent === null){
				// console.log('Perfect tree length');
			} else{
				this.current = this.current.parent;
			}
		}
	}
	this.displayTree = function(){
		Logger.displayTree(this);
	}
}