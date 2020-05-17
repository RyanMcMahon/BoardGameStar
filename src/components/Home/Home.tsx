import React from 'react';
import styled from 'styled-components';
import { detect } from 'detect-browser';

import { WebPage, Content } from '../WebPage';
import { Button } from '../../utils/style';
import { Link } from 'react-router-dom';

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

const FeatureList = styled.ul({
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

const FeatureListPiece = styled.li({
  fontSize: '2rem',
  margin: '.5rem 0',
});

const DownloadsContainer = styled.div({
  textAlign: 'center',
  paddingTop: '5rem',
});

const AllDownloadsLink = styled.a({
  display: 'block',
  margin: '.5rem 0',
  color: '#fff',
  ':focus': {
    color: '#fff',
  },
  ':active': {
    color: '#fff',
  },
  ':hover': {
    color: '#fff',
  },
});

const SectionHeader = styled.h3({
  margin: '6rem 0 0',
});

const VideoWrapper = styled.div({
  position: 'relative',
  paddingBottom: '56.25%' /* 16:9 */,
  paddingTop: '25px',
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});

export function Home() {
  const browser = detect();

  return (
    <WebPage>
      <Hero>
        <Content>
          <Header>Play Board Games Online!</Header>
          <div className="row">
            <div className="six columns">
              <FeatureList>
                <FeatureListPiece>✓ No Sign Up</FeatureListPiece>
                <FeatureListPiece>✓ Play With Anyone</FeatureListPiece>
                <FeatureListPiece>✓ Create Custom Games</FeatureListPiece>
                <FeatureListPiece>✓ Free Forever</FeatureListPiece>
                <FeatureListPiece>✓ Open Source</FeatureListPiece>
              </FeatureList>
            </div>
            <div className="six columns">
              <DownloadsContainer>
                {browser?.os === 'Mac OS' && (
                  <a href="">
                    <Button design="success">Download For Mac</Button>
                  </a>
                )}
                {browser?.os === 'Linux' && (
                  <a href="">
                    <Button design="success">Download For Linux</Button>
                  </a>
                )}
                {browser?.os === 'Windows 10' && (
                  <a href="">
                    <Button design="success">Download For Windows</Button>
                  </a>
                )}
                {!['Mac OS', 'Linux', 'Windows 10'].includes(
                  browser?.os || ''
                ) && (
                  <Link to="/game-select">
                    <Button design="success">Play In Browser</Button>
                  </Link>
                )}

                <AllDownloadsLink href="https://github.com/RyanMcMahon/BoardGameStar/releases">
                  All Downloads
                </AllDownloadsLink>
              </DownloadsContainer>
            </div>
          </div>
        </Content>
      </Hero>

      <Content>
        <SectionHeader>Create Custom Games</SectionHeader>
        <VideoWrapper>
          <iframe
            title="Editor Tutorial"
            width="560"
            height="315"
            src="https://www.youtube.com/embed/n1-KTxXaAWE"
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </VideoWrapper>

        <SectionHeader>Open Source</SectionHeader>
        <div>
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
        </div>
      </Content>
    </WebPage>
  );
}

export default Home;
