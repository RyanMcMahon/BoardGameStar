import React from 'react';
import slug from 'slugid';
import { Route, Switch } from 'react-router-dom';
import { Editor } from '../Editor';
import { CustomGames } from '../CustomGames';
import {
  EditorAction,
  PlayerOption,
  EditorState,
  AnyPieceOption,
} from '../../types';

function reducer(state: EditorState, action: EditorAction) {
  switch (action.type) {
    case 'create_game': {
      const { editorConfig } = action;
      const { gameName } = editorConfig;
      const player1: PlayerOption = {
        id: slug.nice(),
        type: 'player' as const,
        name: 'Player',
        x: 50,
        y: 50,
        width: 0,
        height: 0,
        color: '#e74c3c',
        rotation: 0,
        layer: 99,
      };
      const player2 = {
        id: slug.nice(),
        type: 'player' as const,
        name: 'Player',
        x: 50,
        y: 100,
        width: 0,
        height: 0,
        color: '#f1c40f',
        rotation: 0,
        layer: 99,
      };
      const scenario = {
        id: slug.nice(),
        name: 'Scenario 1',
        pieces: [player1.id, player2.id],
        players: [player1.id, player2.id],
      };
      return {
        gameName,
        curScenario: scenario.id,
        scenarios: {
          [scenario.id]: scenario,
        },
        pieces: {
          [player1.id]: player1,
          [player2.id]: player2,
        },
      };
    }

    case 'update_game_name': {
      return {
        ...state,
        gameName: action.gameName,
      };
    }

    case 'set_cur_scenario': {
      return {
        ...state,
        curScenario: action.scenarioId,
      };
    }

    case 'add_scenario': {
      const { scenario } = action;
      return {
        ...state,
        curScenario: scenario.id,
        scenarios: {
          ...state.scenarios,
          [scenario.id]: scenario,
        },
      };
    }

    case 'duplicate_scenario': {
      const { scenarioId } = action;
      const scenario = state.scenarios[scenarioId];
      const newScenario = {
        ...scenario,
        id: slug.nice(),
        name: `${scenario.name}-duplicate`,
      };
      const pieces: { [id: string]: AnyPieceOption } = {};

      scenario.pieces.forEach(pieceId => {
        const piece = state.pieces[pieceId];
        if (piece.type === 'card') {
          return;
        }

        const pieceCopy = { ...piece, id: slug.nice() };
        pieces[pieceCopy.id] = pieceCopy;

        if (piece.type === 'deck') {
          Object.values(state.pieces).forEach(p => {
            if (p.type === 'card' && p.deckId === pieceId) {
              const cardCopy = { ...p, id: slug.nice(), deckId: pieceCopy.id };
              pieces[cardCopy.id] = cardCopy;
            }
          });
        }
      });

      newScenario.pieces = Object.keys(pieces);
      newScenario.players = Object.values(pieces)
        .filter(piece => piece.type === 'player')
        .map(piece => piece.id);

      return {
        ...state,
        curScenario: newScenario.id,
        scenarios: {
          ...state.scenarios,
          [newScenario.id]: newScenario,
        },
        pieces: {
          ...state.pieces,
          ...pieces,
        },
      };
    }

    case 'update_scenario': {
      const { scenario } = action;
      return {
        ...state,
        scenarios: {
          ...state.scenarios,
          [scenario.id]: {
            ...state.scenarios[scenario.id],
            ...scenario,
          },
        },
      };
    }

    case 'remove_scenario': {
      const { scenarioId } = action;
      const scenarios = { ...state.scenarios };
      delete scenarios[scenarioId];
      const firstScenario = Object.values(scenarios)[0];

      if (!firstScenario) {
        console.log('cannot remove only scenario');
        return state;
      }

      return {
        ...state,
        scenarios,
        curScenario: firstScenario.id,
      };
    }

    case 'add_piece': {
      const { piece } = action;
      const curScenario = state.scenarios[state.curScenario];
      const players =
        piece.type === 'player'
          ? [...curScenario.players, piece.id]
          : curScenario.players;
      return {
        ...state,
        scenarios: {
          ...state.scenarios,
          [curScenario.id]: {
            ...curScenario,
            players,
            pieces: [...curScenario.pieces, piece.id],
          },
        },
        pieces: {
          ...state.pieces,
          [piece.id]: piece,
        },
      };
    }

    case 'update_piece': {
      const { piece } = action;
      return {
        ...state,
        pieces: {
          ...state.pieces,
          [piece.id]: {
            ...state.pieces[piece.id],
            ...piece,
          },
        },
      };
    }

    case 'remove_piece': {
      const { id } = action;
      const curScenario = state.scenarios[state.curScenario];
      const pieces = { ...state.pieces };
      delete pieces[id];
      return {
        ...state,
        pieces,
        scenarios: {
          ...state.scenarios,
          [curScenario.id]: {
            ...curScenario,
            pieces: curScenario.pieces.filter(pieceId => pieceId !== id),
            players: curScenario.players.filter(pieceId => pieceId !== id),
          },
        },
      };
    }

    default:
      throw Error('unhandled EditorAction');
  }
}

export function ExecutableRoutes() {
  const [state, dispatch] = React.useReducer<
    React.Reducer<EditorState, EditorAction>,
    EditorState
  >(
    reducer,
    {
      gameName: '',
      curScenario: '',
      scenarios: {},
      pieces: {},
    },
    (state: EditorState) => state
  );

  return (
    <Switch>
      <Route path="/">
        {state.curScenario ? (
          <Editor dispatch={dispatch} state={state} />
        ) : (
          <CustomGames dispatch={dispatch} />
        )}
      </Route>
    </Switch>
  );
}

export default ExecutableRoutes;
