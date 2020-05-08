import React from 'react';
import styled from 'styled-components';

interface Props {
  complete: number;
}

const Wrapper = styled.div({
  height: '1rem',
  backgroundColor: '#eee',
  width: '100%',
  borderRadius: '4px',
});

const ProgressIndicator = styled.div<{ complete: number }>(
  ({ complete }: { complete: number }) => ({
    backgroundColor: '#08c',
    height: '1rem',
    width: `${complete}%`,
    borderRadius: '4px',
  })
);

export function ProgressBar(props: Props) {
  return (
    <Wrapper>
      <ProgressIndicator complete={props.complete} />
    </Wrapper>
  );
}
