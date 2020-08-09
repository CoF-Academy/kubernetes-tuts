import { loadbalance } from  './loadbalancer/loadbalancer'

let room_names = ['grupo_1', 'grupo_2', 'grupo_3'];

let loadbalancer = loadbalance(room_names, 30)

