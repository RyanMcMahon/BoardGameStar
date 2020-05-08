import React from 'react';
import styled from 'styled-components';

import { WebPage, Content } from '../WebPage';

const Hero = styled.div({
  background: 'linear-gradient(to top, #9D50BB, #6E48AA)',
  paddingBottom: '3rem',
  color: '#fff',
});

const Header = styled.h1({
  textAlign: 'center',
  margin: 0,
  padding: '3rem 0',
  fontSize: '3rem',
});

const Description = styled.div({
  // TODO
});

const FeatureList = styled.ul({
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

const FeatureListItem = styled.li({
  fontSize: '2rem',
  margin: '.5rem 0',
});

const SectionHeader = styled.h3({
  margin: '6rem 0 0',
});

const Screenshot = styled.img({
  margin: '2rem 0',
  maxWidth: '100%',
  boxShadow: '0px 3px 7px rgba(0, 0, 0, 0.5)',
});

export function Home() {
  return (
    <WebPage>
      <Hero>
        <Content>
          <Header>Play Board Games Online!</Header>
          <Description>
            <FeatureList>
              <FeatureListItem>✓ No Sign Up</FeatureListItem>
              <FeatureListItem>✓ Play With Anyone</FeatureListItem>
              <FeatureListItem>✓ Create Custom Games</FeatureListItem>
              <FeatureListItem>✓ Free Forever</FeatureListItem>
              <FeatureListItem>✓ Open Source</FeatureListItem>
            </FeatureList>
          </Description>
        </Content>
      </Hero>
      <Content>
        <SectionHeader>Included Games:</SectionHeader>
        <Screenshot src="/aviary_demo.png" alt="screenshot" />
        <strong>Aviary (Compare with Arboretum)</strong>
        <p>
          Board Game Star currently includes one built-in game. Aviary is a game
          which can be played similarly to Arboretum online with up to 4
          players!
        </p>

        <SectionHeader>Open Source</SectionHeader>
        <p>
          Board Game Star is Open Source. It's written in Typescript with React
          and contributions are emphatically welcomed!
          <ul>
            <li>
              <a href="https://github.com/RyanMcMahon/BoardGameStar">
                View Repo
              </a>
            </li>
            <li>
              <a href="https://github.com/RyanMcMahon/BoardGameStar/issues">
                File a bug
              </a>
            </li>
            <li>
              <a href="https://github.com/RyanMcMahon/BoardGameStar/issues">
                Suggest a feature
              </a>
            </li>
            <li>
              <a href="https://github.com/RyanMcMahon/BoardGameStar/stargazers">
                Star Repo
              </a>
            </li>
          </ul>
        </p>
      </Content>
    </WebPage>
  );
}

export default Home;
