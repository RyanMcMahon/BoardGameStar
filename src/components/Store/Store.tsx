import React from 'react';
import styled from 'styled-components';

import { Link } from 'react-router-dom';
import { getAllGames } from '../../utils/api';
import { Game, PublicGame } from '../../types';

const GamesWrapper = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gridGap: '1rem',
  gridAutoRows: 'minmax(100px, 300px)',
});

const GameLink = styled(Link)({
  ':hover': {
    cursor: 'pointer',
    backgroundColor: '#fafafa',
  },
});

const GameImage = styled.img({
  width: '100%',
  height: '200px',
  objectFit: 'cover',
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
          <GameImage
            src={game.thumbnail ? game.thumbnail : 'board_game_star.png'}
          />
          {game.name}
          {game.tags.map(x => `#${x}`).join(' ')}
          {game.summary}
        </GameLink>
      ))}
    </GamesWrapper>
  );
}
