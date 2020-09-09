class Node {
  constructor(payload = null, next = null) {
    this.payload = payload;
    this.next = next;
  }
}

class PlayQueue {
  head = new Node();
  tail = head;

  enqueue(payload) {
    const node = new Node(payload);
    this.tail.next = node;
    this.tail = node;
  }

  dequeue() {
    let node = this.head.next;
    this.head.next = node.next;
    return node;
  }

  remove(index) {
    let prev = this.head;
    let node;
    for (let i = 0; i <= index; i++) {
      node = prev.next;
    }
    prev.next = node.next;
    return node;
  }

  move(oldIndex, newIndex) {
    let node = this.remove(oldIndex);
    this.#insert(node, newIndex);
  }

  #insert(payload, index) {
    let node = new Node(payload);
    let prev = this.head;
    let next = prev.next;
    for (let i = 0; i < index; i++) {
      prev = prev.next;
      next = next.next;
    }
    prev.next = node;
    node.next = next;
  }
}
module.exports = PlayQueue;
