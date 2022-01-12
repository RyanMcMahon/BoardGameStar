import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { Link, Navigate } from 'react-router-dom';
import {
  useUser,
  signOut,
  sendVerificationEmail,
  updateUserSettings,
  UserSettings,
} from '../../utils/api';
import { FaCheck, FaCircle } from 'react-icons/fa';

const Checklist = styled.ul({
  listStyle: 'none',
  svg: {
    display: 'inline-block',
    marginRight: '1rem',
  },
});

export function MyAccount() {
  const { currentUser, isLoading, userSettings } = useUser() as any;
  const [formInitialized, setFormInitialized] = React.useState(false);
  const [form, setForm] = React.useState<
    Pick<UserSettings, 'displayName' | 'profile'>
  >({
    displayName: '',
    profile: '',
  });
  const handleSubmit = () => updateUserSettings(form);

  React.useEffect(() => {
    if (userSettings && !formInitialized) {
      setFormInitialized(true);
      setForm(userSettings);
    }
  }, [userSettings, formInitialized]);

  if (!currentUser || !userSettings) {
    if (isLoading) {
      return null;
    } else {
      return <Navigate to="/games" />;
    }
  }

  return (
    <>
      <Button design="danger" onClick={signOut}>
        Sign Out {currentUser!.displayName || currentUser!.email}
      </Button>
      <hr />

      <Link to={`/users/${currentUser.uid}`}>View Profile</Link>

      <form>
        <label>
          Display Name
          <br />
          <input
            type="text"
            value={form.displayName}
            onChange={e => {
              const displayName = e.currentTarget.value;
              setForm(f => ({ ...f, displayName }));
            }}
          />
        </label>

        <label>
          Public Profile (markdown)
          <br />
          <textarea
            value={form.profile}
            onChange={e => {
              const profile = e.currentTarget.value;
              setForm(f => ({ ...f, profile }));
            }}
          />
        </label>

        <Button design="primary" type="button" onClick={handleSubmit}>
          Save
        </Button>
      </form>
      <hr />

      <h1>Become A Creator</h1>
      <h2>Creators can make their games available to the public.</h2>
      <Checklist>
        <li>
          {currentUser.emailVerified ? <FaCheck /> : <FaCircle />}
          {currentUser.emailVerified ? (
            'Your email is verified'
          ) : (
            <>
              Verify Email
              <Button
                design="primary"
                onClick={() => sendVerificationEmail(currentUser)}
              >
                Send Verification Email
              </Button>
            </>
          )}
        </li>
        <li>
          {userSettings.displayName ? <FaCheck /> : <FaCircle />}
          Set Display Name
        </li>
        <li>
          {userSettings.public ? <FaCheck /> : <FaCircle />}
          {userSettings.public ? (
            'Your Profile Is Public'
          ) : (
            <Button
              design="primary"
              disabled={!currentUser.emailVerified || !userSettings.displayName}
              onClick={() => updateUserSettings({ public: true })}
            >
              Make Profile Public
            </Button>
          )}
        </li>
      </Checklist>

      {/* <h1>Become A Publisher</h1>
      <h2>Publishers can sell their games.</h2>
      <Checklist>
        <li>
          {permissions.creator ? <FaCheck /> : <FaCircle />}
          Become a creator
        </li>
        <li>
          {permissions.publisher ? <FaCheck /> : <FaCircle />}
          Link stripe account
          <a
            href={(() => {
              if (!permissions.creator) {
                return '';
              }

              const connectParams = Object.entries({
                state: currentUser.uid,
                client_id: clientId,
                scope: 'read_write',
                response_type: 'code',
                'stripe_user[email]': currentUser?.email,
                'stripe_user[url]': `https://boardgamestar.com/users/${currentUser?.uid}`,
                'stripe_user[country]': 'US',
                'stripe_user[physical_product]': 'false',
                'stripe_user[product_description]': 'Digital board games.',
                'stripe_user[currency]': 'USD',
              })
                .map(([key, val]) => `${key}=${val}`)
                .join('&');
              return `https://connect.stripe.com/oauth/authorize?${connectParams}`;
            })()}
          >
            <Button design="primary" disabled={!permissions.creator}>
              Become A Publisher
            </Button>
          </a>
        </li>
      </Checklist> */}
    </>
  );
}
