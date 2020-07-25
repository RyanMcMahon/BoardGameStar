import React from 'react';
import styled from 'styled-components';

import { Button, primaryColor } from '../../utils/style';
import { Link, Redirect, useParams } from 'react-router-dom';
import {
  useUser,
  logIn,
  signOut,
  getGame,
  downloadGame,
} from '../../utils/api';
import { Game, PublicGame } from '../../types';
import { ProgressBar } from '../ProgressBar';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PurchaseModal } from '../PurchaseModal';
import { Markdown } from '../Markdown';

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51H0XjdBwpr2MkFDhoeZGAAX1UV37n2AAtiapBL43spha3vI1CCE9I4veUHqBFnfKa9poTloOP7Ghc0KSp32LkLqY00bMKNXdlY';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const Banner = styled.img({
  width: '100%',
  height: '400px;',
  objectFit: 'cover',
});

const Title = styled.h1({
  fontSize: '3rem',
  fontWeight: 'bold',
  margin: '1rem 0 0',
});

const Tags = styled.div({
  color: primaryColor,
  fontSize: '1.5rem',
});

const Summary = styled.div({
  // TODO
});

const Designer = styled.div({
  // TODO
});

const DesignerLink = styled(Link)({
  // TODO
});

export function GameProfile() {
  const { gameId } = useParams();
  const [game, setGame] = React.useState<PublicGame | null>();
  const [user, setUser] = React.useState<any | null>();
  const [downloadProgress, setDownloadProgress] = React.useState<number>(-1);
  const [purchaseGame, setPurchaseGame] = React.useState<Game | null>(null);

  const handleDownload = async (gameId: string) => {
    setDownloadProgress(0);
    await downloadGame(gameId, setDownloadProgress);
    setDownloadProgress(-1);
    // TODO redirect to games list
  };

  React.useEffect(() => {
    const loadGame = async () => {
      const { game: g, user: u } = await getGame(gameId);
      setUser(u);
      setGame(g);
    };

    loadGame();
  }, [gameId]);

  if (!game) {
    return null; // TODO loading
  }

  return (
    <div>
      {(game.banner || game.thumbnail) && (
        <Banner src={game.banner || game.thumbnail} alt="Game" />
      )}
      <Title>{game.name}</Title>
      <Tags>{game.tags.map(x => `#${x}`).join(' ')}</Tags>
      <Summary>{game.summary}</Summary>
      <Designer>
        Designer:{' '}
        <DesignerLink to={`users/${user.userId}`}>
          {user.displayName}
        </DesignerLink>
      </Designer>
      {downloadProgress >= 0 ? (
        <ProgressBar complete={downloadProgress} />
      ) : (
        <>
          {game.price ? (
            <Button design="primary" onClick={() => setPurchaseGame(game)}>
              Purchase
            </Button>
          ) : (
            <Button design="primary" onClick={() => handleDownload(game.id)}>
              Download
            </Button>
          )}
        </>
      )}
      <Markdown source={game.description} />
      {purchaseGame && (
        <Elements stripe={stripePromise}>
          <PurchaseModal
            game={purchaseGame}
            onClose={() => setPurchaseGame(null)}
          />
        </Elements>
      )}
    </div>
  );
}