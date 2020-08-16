import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { app, twilio, cors } from './utils';

async function getSignedUrl(userId: string, gameId: string, name: string) {
  return (
    await admin
      .storage()
      .bucket(`boardgamestar-21111.appspot.com`)
      .file(`users/${userId}/games/${gameId}/public/${name}`)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000,
      })
  )[0];
}

app.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const gameRef = admin
      .firestore()
      .collection('games')
      .doc(gameId);
    const game = (await gameRef.get()).data() as any;
    const version = `${game.version}`;
    const configRef = gameRef.collection('versions').doc(version);

    if (game.price === 0) {
      const gameConfig = (await configRef.get()).data() as any;
      const pieces = Object.values(gameConfig.config.pieces).filter(
        (piece: any) => piece.image
      );
      const assets: any = {};

      while (pieces.length) {
        const piece = pieces.pop() as any;

        assets[piece.image] = await getSignedUrl(
          gameConfig.userId,
          gameConfig.id,
          piece.image
        );
        if (piece.back && piece.type === 'image') {
          assets[piece.back] = await getSignedUrl(
            gameConfig.userId,
            gameConfig.id,
            piece.back
          );
        }
      }

      res.send({
        assets,
        game: gameConfig,
      });
      return;
    } else {
      // TODO check for purchase

      const config = (await configRef.get()).data();
      // send config
      // create file links
      res.send(config);
    }
  } catch (err) {
    console.log(err);
    res.status(500);
    res.send(err);
  }
});

export const games = functions.https.onRequest(app);

export const servers = functions.https.onRequest((req, res) =>
  cors(req, res, async () => {
    try {
      const token = await twilio.tokens.create();
      res.send(token);
    } catch (err) {
      res.status(500);
      res.send(err);
    }
  })
);

export const updateGame = functions.firestore
  .document('games/{gameId}')
  .onWrite(async (snap, context) => {
    const { gameId } = context.params;
    const { version } = snap.after.data() || {};

    if (!version) {
      return;
    }

    await admin
      .firestore()
      .collection('games')
      .doc(gameId)
      .collection('versions')
      .doc(`${version}`)
      .set(snap.before.data() || {});
    await snap.after.ref.set(
      { config: admin.firestore.FieldValue.delete() },
      { merge: true }
    );
  });
