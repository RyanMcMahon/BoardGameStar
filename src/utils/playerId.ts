// import slug from 'slugid';
import _ from 'lodash';
import adjectives from './adjectives';
import animals from './animals';

function randomAdjective() {
  return _.capitalize(_.sample(adjectives));
}

function randomLetter() {
  return String.fromCharCode(_.random(65, 90));
}

function randomAnimal() {
  return _.capitalize(_.sample(animals));
}

export function getGameId() {
  return `${randomLetter()}${randomLetter()}${randomLetter()}-${_.random(
    1,
    999
  )}`;
}

export function getHostId() {
  const hostId = localStorage.getItem('hostId');

  if (hostId) {
    return hostId;
  }

  const id = `${randomAdjective()}${randomAnimal()}${_.random(1, 99)}`;
  localStorage.setItem('hostId', id);
  return id;
}

export function getInstanceId(gameId: string, hostId: string) {
  return `${hostId}_${gameId}`.toLowerCase();
}

export const getPlayerId = () => getInstanceId(getGameId(), getHostId());
