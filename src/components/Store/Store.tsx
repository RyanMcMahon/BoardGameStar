import React from 'react';
import styled from 'styled-components';

import * as firebase from 'firebase';
import { WebPage, Content } from '../WebPage';
import { GamesMenu } from '../GamesMenu';
import { PurchaseModal } from '../PurchaseModal';
import { Button } from '../../utils/style';
import { Link, Redirect } from 'react-router-dom';
import {
  signUp,
  getCurrentUser,
  useUser,
  getAllGames,
} from '../../utils/server';
import { Game } from '../../types';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51H0XjdBwpr2MkFDhoeZGAAX1UV37n2AAtiapBL43spha3vI1CCE9I4veUHqBFnfKa9poTloOP7Ghc0KSp32LkLqY00bMKNXdlY';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
// , {
//   stripeAccount: 'acct_1AAfzGLVwpOjmOuU',
// }

export function Store() {
  const [games, setGames] = React.useState<Game[]>([]);
  const [purchaseGame, setPurchaseGame] = React.useState<Game | null>(null);

  React.useEffect(() => {
    const loadGames = async () => {
      const g = await getAllGames();
      setGames(g);

      // try {
      //   const x = await firebase
      //     .firestore()
      //     .collection('stripe_customers')
      //     .doc('54MAxJRyw3WCQviaK30ENRQggeI3')
      //     .collection('publisher_accounts')
      //     .get();
      //   debugger;
      // } catch (err) {
      //   debugger;
      // }
    };
    loadGames();
  }, []);

  return (
    <WebPage>
      <Content>
        <GamesMenu />
        <h1>Store</h1>
        {games.map(game => (
          <div key={game.id}>
            {game.name}
            {game.price ? (
              <Button design="primary" onClick={() => setPurchaseGame(game)}>
                Purchase
              </Button>
            ) : (
              <Button design="primary">Download</Button>
            )}
          </div>
        ))}

        {purchaseGame && (
          <Elements stripe={stripePromise}>
            <PurchaseModal
              game={purchaseGame}
              onClose={() => setPurchaseGame(null)}
            />
          </Elements>
        )}
      </Content>
    </WebPage>
  );
}
