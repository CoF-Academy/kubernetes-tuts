class Room {
  name: String;
  capacity: number;
  max_capacity: number;

  constructor(name: String, capacity: number, max_capacity: number) {
    this.name = name;
    this.capacity = capacity;
    this.max_capacity = max_capacity;
  }
}

class PQ {
  rooms: Array<Room> = [];

  enqueue(room: Room) {
    this.rooms.push(room);
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

  private _reorganize() {
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
  }

  dequeue() {
    const max = this.rooms[0];
    const end = this.rooms.pop() as Room;
    this.rooms[0] = end;
    this._reorganize();
    return max;
  }
  
  incrementByName(name: String) {
    let found = false;
    for (let i = 0; i < this.rooms.length; i++) {
      let current = this.rooms[i];
      if (current.name === name) {
        found = true;
        if (current.capacity < current.max_capacity) {
          current.capacity += 1;
        } else {
          throw new Error(`Group ${name} is already at max capacity`);
        }
        break;
      }
    }
    if (!found) throw new Error(`Group ${name} was not found`);
    this._reorganize();
  }
}

export class LoadBalancer {
  private pq: PQ;
  constructor(names: Array<String>, capacity: number) {
    if (names.length === 0)
      throw new Error('Names array cannot be empty');
    this.pq = new PQ();
    for (const name of names) {
      this.pq.enqueue(new Room(name, capacity, capacity));
    }
  }

  getAllRoomsCopy() {
    return Array.of(...this.pq.rooms);
  }

  getGroup() {
    let room = this.pq.dequeue();
    if (room.capacity <= 0) {
      throw new Error(`All of the rooms are at maximum capacity (${room.max_capacity})`);
    }
    room.capacity--;
    this.pq.enqueue(room);
    return room.name;
  }

  incrementByName(name: String) {
    this.pq.incrementByName(name);
  }
}
