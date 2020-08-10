import { loadbalance, LoadBalancer } from  '../src/loadbalancer/loadbalancer'

// TODO reorganize to use classes instead of closure

let rooms_names = ['group_1', 'group_2', 'group_3'];
describe("Loadbalance function", () => {
  test("It should give an error when the group_names are empty", () => {
    try {
      loadbalance([], 30)
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "First argument cannot be empty");
    }
  });

  test("it should give you the last group of the names provided", () => {
    let room_getter = loadbalance(rooms_names, 30)
    let expected = rooms_names[rooms_names.length - 1];
    expect(room_getter()).toEqual(expected);
  });

  test("it should give you the second group of the names provided", () => {
    let room_getter = loadbalance(rooms_names, 30)
    // Get the last
    room_getter();
    let expected = rooms_names[1];
    expect(room_getter()).toEqual(expected);
  });

  test("it should give you the first group of the names provided", () => {
    let room_getter = loadbalance(rooms_names, 30)
    // Get the last
    room_getter();
    // Get the second
    room_getter();
    let expected = rooms_names[0];
    expect(room_getter()).toEqual(expected);
  });

  test("It should give an error when it reaches maximum capacity", () => {
    let room_getter = loadbalance(rooms_names, 30)
    for(let i=0; i < 90; i++) {
      room_getter();
    }
    try {
      room_getter();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "All of the rooms are at maximux capacity (30)");
    }
  });

  test("It should update the correspodent group when we incrementByName", () => {
    let loadbalancer = new LoadBalancer(rooms_names, 10)
    for(let i=0; i < 10; i++) {
      let name = loadbalancer.getGroup();
      loadbalancer.incrementByName(name);
    }
    loadbalancer.printGroups();
    // loadbalancer.incrementByName("group_1");
    // loadbalancer.printGroups();
  });
});
