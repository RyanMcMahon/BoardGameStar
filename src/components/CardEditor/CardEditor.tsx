import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { CardPiece, Assets } from '../../types';
import { useAsset } from '../Piece/utils';

interface Props {
  onDelete: () => void;
  onUpdateCount: (counts: string) => void;
  card: CardPiece;
  assets: Assets;
}

const Wrapper = styled.div({
  marginTop: '.5rem',
  marginLeft: '.5rem',
});

const Img = styled.img({
  width: 200,
  height: 200,
});

export function CardEditor(props: Props) {
  const { assets, card } = props;
  const inputRef = React.createRef<HTMLInputElement>();
  const image = useAsset(assets, card);

  const handleOnChange = (e: React.FormEvent<HTMLInputElement>) => {
    props.onUpdateCount(e.currentTarget.value);
  };

  return (
    <Wrapper>
      <Img src={image?.src} />
      <br />
      <input
        type="text"
        value={card.counts}
        ref={inputRef}
        min={1}
        onChange={handleOnChange}
      />
      <br />
      <Button design="danger" onClick={props.onDelete}>
        Delete
      </Button>
    </Wrapper>
  );
}
