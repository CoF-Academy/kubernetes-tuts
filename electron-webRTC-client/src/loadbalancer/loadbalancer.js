'use strict';

class Room {
  constructor(val, capacity) {
    this.val = val;
    this.capacity = capacity;
  }
}

class PQ {
  constructor() {
    this.values = [];
  }
  enqueue(val, capacity) {
    let newRoom = new Room(val, capacity);
    this.values.push(newRoom);
    let index = this.values.length - 1;
    const current = this.values[index];

    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      let parent = this.values[parentIndex];

      if (parent.capacity <= current.capacity) {
        this.values[parentIndex] = current;
        this.values[index] = parent;
        index = parentIndex;
      } else break;
    }
  }
  print() {
    console.log(this.values);
  }
  dequeue() {
    const max = this.values[0];
    const end = this.values.pop();
    this.values[0] = end;

    let index = 0;
    const length = this.values.length;
    const current = this.values[0];
    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIndex < length) {
        leftChild = this.values[leftChildIndex];
        if (leftChild.capacity > current.capacity) swap = leftChildIndex;
      }
      if (rightChildIndex < length) {
        rightChild = this.values[rightChildIndex];
        if (
          (swap === null && rightChild.capacity > current.capacity) ||
          (swap !== null && rightChild.capacity > leftChild.capacity)
        )
          swap = rightChildIndex;
      }

      if (swap === null) break;
      this.values[index] = this.values[swap];
      this.values[swap] = current;
      index = swap;
    }

    return max;
  }
}

module.exports = function (rooms_names, max_capacity) {
  if (rooms_names === undefined || rooms_names === null || !Array.isArray(rooms_names))
    throw new Error('Expecting first argument to be an array of strings');
  else if (rooms_names.length === 0)
    throw new Error('First argument cannot be empty');

  // Init priority queue with rooms and capacity
  const tree = new PQ();
  for (const name of rooms_names) {
    tree.enqueue(name, max_capacity);
  }

  return function () {
    let room = tree.dequeue();
    if (room.capacity <= 0) {
      throw new Error(`All of the rooms are at maximux capacity (${max_capacity})`);
    }
    room.capacity--;
    tree.enqueue(room.val, room.capacity);
    tree.print();
    return room.val;
  }
}

