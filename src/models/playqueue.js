class Node {
  constructor(payload = null, next = null) {
    this.payload = payload;
    this.next = next;
  }
}

class PlayQueue {
  constructor() {
    if (!PlayQueue._instance) {
      PlayQueue._instance = this;
      this.head = new Node();
      this.tail = this.head;
      this._size = 0;
    }
    return PlayQueue._instance;
  }

  get size() {
    return this._size;
  }

  enqueue(song) {
    this._size += 1;
    const node = new Node(song);
    this.tail.next = node;
    this.tail = node;
  }

  dequeue() {
    this._size -= 1;
    let node = this.head.next;
    this.head.next = node.next;
    return node.payload;
  }

  remove(index) {
    this._size -= 1;
    let prev = this.head;
    let node = prev.next;
    for (let i = 1; i <= index; i++) {
      node = node.next;
      prev = prev.next;
    }
    prev.next = node.next;
    return node.payload;
  }

  move(oldIndex, newIndex) {
    let song = this.remove(oldIndex);
    this.#insert(song, newIndex);
  }

  #insert(song, index) {
    this._size += 1;
    let node = new Node(song);
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
