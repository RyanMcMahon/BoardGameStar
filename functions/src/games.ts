import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { app } from './utils';

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

        // console.log(
        //   '==== file',
        //   `boardgamestar-21111.appspot.com/users/${gameConfig.userId}/games/${gameConfig.id}/public/${piece.image}`
        // );
        // const fileExists = await admin
        //   .storage()
        //   .bucket(`boardgamestar-21111.appspot.com`)
        //   .file(
        //     `users/${gameConfig.userId}/games/${gameConfig.id}/public/${piece.image}`
        //   )
        //   .exists();
        // console.log('exists', fileExists);

        assets[piece.image] = (
          await admin
            .storage()
            .bucket(`boardgamestar-21111.appspot.com`)
            .file(
              `users/${gameConfig.userId}/games/${gameConfig.id}/public/${piece.image}`
            )
            .getSignedUrl({
              action: 'read',
              expires: Date.now() + 60 * 60 * 1000,
            })
        )[0];
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
  // res.send(Widgets.getById(req.params.id))
});

// Expose Express API as a single Cloud Function:
export const games = functions.https.onRequest(app);

export const updateGame = functions.firestore
  .document('games/{gameId}')
  .onWrite(async (snap, context) => {
    const { gameId } = context.params;
    const { version } = snap.after.data() || {};
    console.log('write', gameId, version);
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
