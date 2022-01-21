import React from 'react';
import styled from 'styled-components';
import slug from 'slugid';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { CardEditor } from '../CardEditor';
import {
  EditorAction,
  EditorState,
  Assets,
  CardPiece,
  AnyPieceOption,
} from '../../types';
import { getAssetDimensions, filePrompt } from '../../utils/assets';

interface Props {
  onClose: () => void;
  dispatch: React.Dispatch<EditorAction>;
  state: EditorState;
  deckId: string;
  assets: Assets;
  setAssets: (fn: (a: Assets) => any) => void;
}

const CardsWrapper = styled.div({
  display: 'flex',
  width: '845px',
  flexWrap: 'wrap',
  overflowY: 'scroll',
  height: '600px',
});

export function DeckEditorModal(props: Props) {
  const { assets, state, deckId, dispatch, setAssets } = props;
  const handleAddCard = async () => {
    try {
      const files = await filePrompt();

      files.forEach(async (file, index: number) => {
        const filename = file.name;
        const asset = file.content;
        const { width, height } = await getAssetDimensions(asset);
        const id = slug.nice();
        const piece = {
          id,
          deckId,
          width,
          height,
          type: 'card' as const,
          image: filename,
          x: 50,
          y: 50,
          faceDown: false,
          rotation: 0,
          counts: '1',
          layer: 3,
          cardId: '1',
        };
        dispatch({
          piece,
          type: 'add_piece',
        });
        setAssets((a) => ({ ...a, [filename]: asset }));
      });
    } catch (err) {
      console.log(err);
    }
  };

  const cards = Object.values(state.pieces).filter(
    (piece) => (piece as any).deckId === deckId
  );

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Deck Editor</Modal.Title>
        <Button design="primary" onClick={handleAddCard}>
          Add Card
        </Button>

        <CardsWrapper>
          {cards.map((card) => (
            <CardEditor
              key={card.id}
              onDelete={() =>
                dispatch({
                  type: 'remove_piece',
                  id: card.id,
                })
              }
              onUpdateCount={(counts: string) =>
                dispatch({
                  type: 'update_piece',
                  piece: {
                    ...card,
                    counts,
                  } as AnyPieceOption,
                })
              }
              card={card as CardPiece}
              assets={assets}
            />
          ))}
        </CardsWrapper>
      </Modal.Content>
    </Modal>
  );
}
