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
  
  // TODO check if the capacity doesn't pass max_capacity
  incrementByName(name: String) {
    let found = false;
    for (let i = 0; i < this.rooms.length; i++) {
      if (this.rooms[i].name === name) {
        console.log(name);
        found = true;
        this.rooms[i].capacity += 1;
        break;
      }
    }
    if (!found) throw new Error(`Group ${name} was not found`);
    this._reorganize();
  }
}

export class LoadBalancer {
  private pq: PQ;
  private roomCapacity: number;
  constructor(names: Array<String>, capacity: number) {
    this.roomCapacity = capacity;
    if (names.length === 0)
      throw new Error('names array cannot be empty');
    this.pq = new PQ();
    for (const name of names) {
      this.pq.enqueue(name, capacity);
    }
  }

  

  printGroups() {
    console.log(this.pq.rooms); 
  }

  getGroup() {
    let room = this.pq.dequeue();
    if (room.capacity <= 0) {
      throw new Error(`All of the rooms are at maximux capacity (${this.roomCapacity})`);
    }
    room.capacity--;
    this.pq.enqueue(room.name, room.capacity);
    return room.name;
  }

  incrementByName(name: String) {
    this.pq.incrementByName(name);
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
