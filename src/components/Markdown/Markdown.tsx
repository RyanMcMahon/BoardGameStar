import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

interface Props {
  source: string;
}

const MarkdownContainer = styled(ReactMarkdown)({
  '*': {
    margin: 0,
  },

  h1: {
    fontSize: '2.8rem',
    fontWeight: 'bold',
  },
  h2: {
    fontSize: '2.4rem',
  },
  h3: {
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  p: {
    margin: '1rem 0',
  },
});

export function Markdown(props: Props) {
  return <MarkdownContainer linkTarget="_blank" source={props.source} />;
}
