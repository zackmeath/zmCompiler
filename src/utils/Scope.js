function Scope(num){
	this.num = num;
	this.parent = parent;
	this.vars = {};
	this.children = [];
	this.setParent = function(parent){
		this.parent = parent;
	}
	this.addChild = function(child){
		this.children.push(child);
	}
}