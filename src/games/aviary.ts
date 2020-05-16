import _ from 'lodash';
import { Config, GameConfig } from '../types';

// const twoPlayer: GameConfig = {
//   players: [
//     {
//       color: '#e74c3c',
//       x: 0,
//       y: 500,
//     },
//     {
//       color: '#f1c40f',
//       x: 500,
//       y: 500,
//     },
//   ],
//   board: [],
//   decks: [
//     {
//       name: 'Birds',
//       id: 'Birds',
//       image: 'games/aviary/deck.png',
//       x: 0,
//       y: 0,
//       width: 200,
//       height: 300,
//       cards: [
//         ...[...Array(8)].map(
//           (x, index) => `games/aviary/bearded_tit_${index + 1}.png`
//         ),
//         ...[...Array(8)].map((x, index) => `games/aviary/owl_${index + 1}.png`),
//         ...[...Array(8)].map(
//           (x, index) => `games/aviary/crow_${index + 1}.png`
//         ),
//         ...[...Array(8)].map(
//           (x, index) => `games/aviary/falcon_${index + 1}.png`
//         ),
//         ...[...Array(8)].map(
//           (x, index) => `games/aviary/white_wagtail_${index + 1}.png`
//         ),
//         ...[...Array(8)].map(
//           (x, index) => `games/aviary/spotted_flycatcher_${index + 1}.png`
//         ),
//       ],
//     },
//   ],
// };

// const threePlayer: GameConfig = _.cloneDeep(twoPlayer);
// threePlayer.players.push({
//   color: '#1abc9c',
//   x: 1000,
//   y: 500,
// });

// threePlayer.decks[0].cards.push(
//   ...([
//     ...[...Array(8)].map(
//       (x, index) => `games/aviary/kingfisher_${index + 1}.png`
//     ),
//     ...[...Array(8)].map(
//       (x, index) => `games/aviary/woodpecker_${index + 1}.png`
//     ),
//   ] as any)
// );

// const fourPlayer: GameConfig = _.cloneDeep(threePlayer);
// fourPlayer.players.push({
//   color: '#3498db',
//   x: 1500,
//   y: 500,
// });

// fourPlayer.decks[0].cards.push(
//   ...([
//     ...[...Array(8)].map((x, index) => `games/aviary/vulture_${index + 1}.png`),
//     ...[...Array(8)].map((x, index) => `games/aviary/kite_${index + 1}.png`),
//   ] as any)
// );

// export const Aviary: Config = [
//   {
//     name: '2 Players',
//     config: twoPlayer,
//   },
//   {
//     name: '3 Players',
//     config: threePlayer,
//   },
//   {
//     name: '4 Players',
//     config: fourPlayer,
//   },
// ];

export const Aviary = [];
