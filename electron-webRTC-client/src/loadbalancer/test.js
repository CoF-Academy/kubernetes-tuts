'use strict';

const assert = require('assert');
const { AssertionError } = require('assert');
const loadbalancer = require('./loadbalancer');

let rooms_names = ['group_1', 'group_2', 'group_3'];
let room = loadbalancer(rooms_names, 30);

assert(room() === 'group_3', 'First call should return the last element');
assert(room() === 'group_2', 'Second call should return the second element');
assert(room() === 'group_1', 'Third call should return the first element');

try {
  let empty = loadbalancer(null, null);
} catch (e) {
  if (e instanceof AssertionError) {
    throw e;
  }
  assert.equal(e.message, 'Expecting first argument to be an array of strings');
}
