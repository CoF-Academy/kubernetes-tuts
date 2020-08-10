class Room {
  name: String;
  capacity: number;

  constructor(name: String, capacity: number) {
    this.name = name;
    this.capacity = capacity;
  }
}

class PQ {
  rooms: Array<Room> = [];

  enqueue(room_name: String, capacity: number) {
    this.rooms.push(new Room(room_name, capacity));
    let index = this.rooms.length - 1;
    const current = this.rooms[index];

    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      let parent = this.rooms[parentIndex];

      if (parent.capacity <= current.capacity) {
        this.rooms[parentIndex] = current;
        this.rooms[index] = parent;
        index = parentIndex;
      } else break;
    }
  }

  dequeue() {
    const max = this.rooms[0];
    const end = this.rooms.pop() as Room;
    this.rooms[0] = end;

    let index = 0;
    const length = this.rooms.length;
    const current = this.rooms[0];
    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let leftChild!: Room, rightChild!: Room;
      let swap = null;

      if (leftChildIndex < length) {
        leftChild = this.rooms[leftChildIndex];
        if (leftChild.capacity > current.capacity) swap = leftChildIndex;
      }
      if (rightChildIndex < length) {
        rightChild = this.rooms[rightChildIndex];
        if (
          (swap === null && rightChild.capacity > current.capacity) ||
          (swap !== null && rightChild.capacity > leftChild.capacity)
        )
          swap = rightChildIndex;
      }

      if (swap === null) break;
      this.rooms[index] = this.rooms[swap];
      this.rooms[swap] = current;
      index = swap;
    }

    return max;
  }
}

export function loadbalance(rooms_names: Array<String>, max_capacity: number) {
  if (rooms_names.length === 0)
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
    tree.enqueue(room.name, room.capacity);
    return room.name;
  }
}
