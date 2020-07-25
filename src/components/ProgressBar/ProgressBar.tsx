import React from 'react';
import styled from 'styled-components';
import { primaryColor } from '../../utils/style';

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
    backgroundColor: primaryColor,
    height: '1rem',
    width: `${complete}%`,
    borderRadius: '4px',
  })
);

export function ProgressBar(props: Props) {
  const percentage = props.complete <= 100 ? props.complete : 100;

  return (
    <Wrapper>
      <ProgressIndicator complete={percentage} />
    </Wrapper>
  );
}
