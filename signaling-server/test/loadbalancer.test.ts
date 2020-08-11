import { LoadBalancer } from  '../src/loadbalancer/loadbalancer'

let rooms_names = ['group_1', 'group_2', 'group_3'];
describe("Loadbalance function", () => {
  test("It should give an error when the group_names are empty", () => {
    try {
      new LoadBalancer([], 10);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Names array cannot be empty");
    }
  });

  test("it should give you the last group of the names provided", () => {
    let loadbalancer = new LoadBalancer(rooms_names, 30);
    let expected = rooms_names[rooms_names.length - 1];
    expect(loadbalancer.getGroup()).toEqual(expected);
  });

  test("it should give you the second group of the names provided", () => {
    let loadbalancer = new LoadBalancer(rooms_names, 30);
    // Get the last
    loadbalancer.getGroup();
    let expected = rooms_names[1];
    expect(loadbalancer.getGroup()).toEqual(expected);
  });

  test("it should give you the first group of the names provided", () => {
    let loadbalancer = new LoadBalancer(rooms_names, 30);
    // Get the last
    loadbalancer.getGroup();
    // Get the second
    loadbalancer.getGroup();
    let expected = rooms_names[0];
    expect(loadbalancer.getGroup()).toEqual(expected);
  });

  test("It should give an error when it reaches maximum capacity", () => {
    let loadbalancer = new LoadBalancer(rooms_names, 30);
    for(let i=0; i < 90; i++) {
      loadbalancer.getGroup();
    }
    try {
      loadbalancer.getGroup();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "All of the rooms are at maximum capacity (30)");
    }
  });

  test("It should update the correspodent group when we incrementByName", () => {
    let loadbalancer = new LoadBalancer(rooms_names, 10)
    // Reduce all of the groups capacity to 0
    for(let i=0; i < 30; i++) {
      loadbalancer.getGroup();
    }
    // Increase first group by 1
    loadbalancer.incrementByName(rooms_names[0]);
    // Expect that if we increase the previous group by one it reflects the operation
    expect(loadbalancer.getAllRoomsCopy().find(e => rooms_names[0] === e.name)?.capacity).toEqual(1);

    // Increase second group by 1
    loadbalancer.incrementByName(rooms_names[2]);
    // Expect that if we increase the previous group by one it reflects the operation
    expect(loadbalancer.getAllRoomsCopy().find(e => rooms_names[2] === e.name)?.capacity).toEqual(1);

    // Increase second group by 1 (two now)
    loadbalancer.incrementByName(rooms_names[2]);
    // Expect that if we increase the previous group by one it reflects the operation
    expect(loadbalancer.getAllRoomsCopy().find(e => rooms_names[2] === e.name)?.capacity).toEqual(2);
  });

  test("It should give and error when we try to add one to a group with maximum capacity", () => {
    let loadbalancer = new LoadBalancer(rooms_names, 10)

    try {
      loadbalancer.incrementByName(rooms_names[2]);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Group group_3 is already at max capacity");
    }

    try {
      loadbalancer.incrementByName(rooms_names[1]);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Group group_2 is already at max capacity");
    }

    try {
      loadbalancer.incrementByName(rooms_names[0]);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Group group_1 is already at max capacity");
    }
  });
});
