import React from 'react';
import styled from 'styled-components';

import { Link } from 'react-router-dom';
import { getAllGames } from '../../utils/api';
import { PublicGame } from '../../types';
import { primaryColor } from '../../utils/style';
import { StorageImage } from '../StorageImage';

const GamesWrapper = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gridGap: '1rem',

  ...[0, 300, 600, 900, 1200, 1500, 1800].reduce(
    (agg, breakpoint, index, arr) => ({
      ...agg,
      [`@media (min-width: ${breakpoint}px) and (max-width: ${arr[index + 1] ||
        999999}px)`]: {
        gridTemplateColumns: `repeat(${breakpoint / 300}, 1fr)`,
      },
    }),
    {}
  ),
});

const GameLink = styled(Link)({
  padding: '0.5rem',
  color: '#000',
  textDecoration: 'none',
  ':hover': {
    color: '#000',
    cursor: 'pointer',
    backgroundColor: '#f8f8f8',
  },
});

const GameHeader = styled.h3({
  fontSize: '3rem',
  fontWeight: 'bold',
  margin: 0,
});

const Tags = styled.div({
  color: primaryColor,
  fontSize: '1.5rem',
});

const GameSummary = styled.div({
  height: '80px',
  overflow: 'hidden',
});

export function Store() {
  const [games, setGames] = React.useState<PublicGame[]>([]);

  React.useEffect(() => {
    const loadGames = async () => {
      const g = await getAllGames();
      setGames(g);
    };
    loadGames();
  }, []);

  return (
    <GamesWrapper>
      {games.map(game => (
        <GameLink key={game.id} to={`/games/${game.id}`}>
          <StorageImage
            width="100%"
            height="200px"
            userId={game.userId}
            gameId={game.id}
            src={game.thumbnail ? game.thumbnail : 'board_game_star.png'}
          />
          <GameHeader>{game.name}</GameHeader>
          <Tags>{game.tags.map(x => `#${x}`).join(' ')}</Tags>
          <GameSummary>{game.summary}</GameSummary>
        </GameLink>
      ))}
    </GamesWrapper>
  );
}
