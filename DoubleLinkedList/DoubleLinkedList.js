/**
 * Created by Stefano on 31/03/14.
 */

/**
 * The single node of the list.
 * @param item The item to store in the node.
 * @constructor
 */
function Node(item) {
	/**
	 * The item stored.
	 * @type {Object}
	 */
	this.item = item;
	/**
	 * The next node. It's null if there's no a next node.
	 * @type {Node|null}
	 */
	this.next = null;
	/**
	 * The previous node. It's null if there's no a previous node.
	 * @type {Node|null}
	 */
	this.previous = null;
}

/**
 * Class for managing a linked list.
 * @constructor
 */
function DoubleLinkedList() {
	/**
	 * The first node of the list.
	 * @type {Node|null}
	 */
	this.first = null;
	/**
	 * The last node of the list.
	 * @type {Node|null}
	 */
	this.last = null;
	/**
	 * The length of the list.
	 * @type {number}
	 */
	this.length = 0;
}

/**
 * Add an item at the head of the list.
 * @param item The item to add.
 * @return {void}
 */
DoubleLinkedList.prototype.pushFront = function (item) {
	var node = new Node(item);
	node.next = this.first;
	this.first = node;
	//link the next node to the new node
	if (node.next)
		node.next.previous = node;
	else
		this.last = node;
	this.length++;
};

/**
 * Add an item at the tail of the list.
 * @param item The item to add.
 * @return {void}
 */
DoubleLinkedList.prototype.pushBack = function (item) {
	var node = new Node(item);
	node.previous = this.last;
	this.last = node;
	//link the previous node to the new node
	if (node.previous)
		node.previous.next = node;
	else
		this.first = node;
	this.length++;
};

/**
 * Remove the first element of the list.
 * @return {Object|undefined} The element removed. It's undefined if the list is empty.
 */
DoubleLinkedList.prototype.popFront = function () {
	if (this.length) {
		var node = this.first;
		this.first = node.next;
		if (node.next)
			node.next.previous = null;
		this.length--;
		node.next = null;
		return node.item;
	}
	return undefined;
};

/**
 * Remove the last element of the list.
 * @return {Object|undefined} The element removed. It's undefined if the list is empty.
 */
DoubleLinkedList.prototype.popBack = function () {
	if (this.length) {
		var node = this.last;
		this.last = node.previous;
		if (node.previous)
			node.previous.next = null;
		this.length--;
		node.previous = null;
		return node.item;
	}
	return undefined;
};

/**
 * Remove the item at the position index.
 * @param index The position of the item to remove.
 * @return {Object|undefined}
 */
DoubleLinkedList.prototype.removeAt = function (index) {
	if (index < 0 || index > this.length - 1)
		return undefined;
	if (index === 0)
		return this.popFront();
	if (index === this.length - 1)
		return this.popBack();
	var node = this.first;
	for (; index > 0; index--)
		node = node.next;
	//now node is the node to remove
	node.previous.next = node.next;
	node.next.previous = node.previous;
	node.next = null;
	node.previous = null;
	this.length--;
	return node.item;
};

/**
 * Get the item at the position index.
 * @param index The position of the item.
 * @return {Object|undefined}. It's undefined if index isn't in the queue bounds.
 */
DoubleLinkedList.prototype.getItem = function (index) {
	if (index < 0 || index > this.length - 1)
		return undefined;
	var node;
	var m = Math.floor(this.length / 2);
	if (index < m) //if the index is less than the middle, the search start from the head of the list, otherwise from the tail of the list
		for (node = this.first; index > 0; index--)
			node = node.next;
	else
		for (index = this.length - index - 1, node = this.last; index > 0; index--)
			node = node.previous;
	return node.item;
};

/**
 * Get the node at the position index relative from the node.
 * @param node The node from which start the search.
 * @param index The index, relative to the node, of the node to return.
 * @return {Node} The node at the position index.
 */
DoubleLinkedList.prototype.getNode = function (node, index) {
	if (!node)
		node = this.head;
	for (; index > 0; index--)
		node = node.next;
	return node;
};

/**
 * Sort the list using web workers.
 * Using this method is discouraged. Many web browser set a limit to the maximum number of workers instantiated.
 * The items of the list, due to web workers implementation, will be serialized so they will lost own methods.
 */
DoubleLinkedList.prototype.parallelSort = function () {

	var workers = [];
	var _array = this.toArray();
	console.log(_array);

	function partialSort(_from, _to, _id) {
		if (_from < _to) {
			var m = Math.floor((_from + _to) / 2);
			var workerLeft = new Worker("DoubleLinkedList/WorkerSort.js");
			var workerRight = new Worker("DoubleLinkedList/WorkerSort.js");
			workers.push(workerLeft);
			workers.push(workerRight);
			var length = workers.length;
			workerLeft.postMessage({cmd: 'start', from: _from, to: m, worker: _id});
			workerRight.postMessage({cmd: 'start', from: m + 1, to: _to, worker: _id});
			partialSort(_from, m, length - 2);
			partialSort(m + 1, _to, length - 1);
			workerLeft.onmessage = function (event) {
				var data = event.data;
				switch (data.cmd) {
					case 'finished':
						workers[data.worker].postMessage({cmd: 'finished', array: _array});
						break;
					case 'replace':
						_array[data.index] = data.value;
						break;
				}
			}
			workerRight.onmessage = function (event) {
				var data = event.data;
				switch (data.cmd) {
					case 'finished':
						workers[data.worker].postMessage({cmd: 'finished', array: _array});
						break;
					case 'replace':
						_array[data.index] = data.value;
						break;
				}
			}
		}
	}

	var outerThis = this;

	var mainWorker = new Worker("DoubleLinkedList/WorkerSort.js");
	workers.push(mainWorker);
	mainWorker.postMessage({cmd: 'start', from: 0, to: this.length - 1, worker: -1, array: _array});
	mainWorker.onmessage = function (event) {
		var data = event.data;
		switch (data.cmd) {
			case 'finished':
				outerThis.fromArray(_array);
				console.log(outerThis);
				break;
			case 'replace':
				_array[data.index] = data.value;
		}
	}
	partialSort(0, this.length - 1, 0);
};

/**
 * Sort the list.
 */
DoubleLinkedList.prototype.sort = function (callback) {

	if (!callback)
		callback = function (item) {
			return item;
		};

	var outerThis = this;

	function partialSort(from, to, fromNode, toNode) {
		if (from < to) {
			var m = Math.floor((from + to) / 2);
			var mNode = outerThis.getNode(fromNode, m - from);
			partialSort(from, m, fromNode, mNode);
			partialSort(m + 1, to, mNode.next, toNode);
			merge(from, m, to, fromNode);
		}
	}

	function merge(from, m, to, fromNode) {
		var left = [];
		var right = [];
		var node = fromNode;
		for (var i = 0; i < m - from + 1; i++, node = node.next)
			left[i] = node.item;
		for (var j = 0; j < to - m; j++, node = node.next)
			right[j] = node.item;
		var x = 0, y = 0;
		for (var k = from; k < to + 1; k++, fromNode = fromNode.next) {
			if (y > to - m - 1 || (callback(left[x]) <= callback(right[y]) && x < m - from + 1)) {
				fromNode.item = left[x];
				x++;
			} else {
				fromNode.item = right[y];
				y++;
			}
		}
	}

	partialSort(0, this.length - 1, this.first, this.last);
};

/**
 * Transform the list into an array.
 * @return {Array} The array built.
 */
DoubleLinkedList.prototype.toArray = function () {
	var array = [];
	for (var node = this.first, i = 0; node; node = node.next, i++)
		array[i] = node.item;
	return array;
}

/**
 * Build the list from the array.
 * @param array The array from which build the list.
 */
DoubleLinkedList.prototype.fromArray = function (array) {
	var node = this.first;
	for (var i = 0; i < Math.min(this.length, array.length); i++, node = node.next)
		node.item = array[i];
	if (this.length < array.length)
		for (var j = this.length; j < array.length; j++)
			this.pushBack(array[j]);
	else
		for (var k = array.length; k < this.length;)
			this.popBack();
}