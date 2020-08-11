import * as admin from 'firebase-admin';

import * as users from './users';
import * as games from './games';
import * as payments from './payments';
import * as publishers from './publishers';

admin.initializeApp();

// Users
exports.createUserAccount = users.createUserAccount;
exports.updateUser = users.updateUser;
exports.cleanupUser = users.cleanupUser;

// Games
exports.updateGame = games.updateGame;
exports.games = games.games;
exports.servers = games.servers;

// Payments
exports.createStripePayment = payments.createStripePayment;
exports.confirmStripePayment = payments.confirmStripePayment;

// Publishers
exports.oauth = publishers.oauth;
