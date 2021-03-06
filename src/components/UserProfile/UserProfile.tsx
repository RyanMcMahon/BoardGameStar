import React from 'react';

import { useParams } from 'react-router-dom';
import { getUserProfile, UserSettings } from '../../utils/api';
import { Game } from '../../types';

export function UserProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = React.useState<UserSettings | null>();
  const [games, setGames] = React.useState<Game[]>([]);

  React.useEffect(() => {
    const loadUserProfile = async () => {
      const { profile, games } = await getUserProfile(userId);
      setProfile(profile);
      setGames(games);
    };
    loadUserProfile();
  }, [userId]);

  if (!profile) {
    return null;
  }

  return (
    <>
      <h1>{profile.displayName}</h1>
      {profile.profile}

      {games.map(game => (
        <div>{game.name}</div>
      ))}
    </>
  );
}
