import slug from 'slugid';

import {
  EditorAction,
  PlayerOption,
  EditorState,
  AnyPieceOption,
} from '../../types';
import { isWebBuild } from '../../utils/meta';

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case 'create_game': {
      const { name, id } = action;
      const player1: PlayerOption = {
        id: slug.nice(),
        type: 'player' as const,
        name: 'Player 1',
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
        name: 'Player 2',
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
        renderCount: 0,
        name,
        id,
        version: 1,
        store: isWebBuild ? 'browser' : 'file',
        tags: [],
        summary: '',
        description: '',
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

    case 'edit_game': {
      const cleanConfig = {
        ...action.config,
      };
      delete cleanConfig!.loadAssets;
      return cleanConfig;
    }

    case 'update_game': {
      return {
        ...state,
        ...action.game,
      };
    }

    case 'update_player_stat_config': {
      return {
        ...state,
        playerStats: action.playerStats,
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

      scenario.pieces.forEach((pieceId) => {
        const piece = state.pieces[pieceId];
        if (piece.type === 'card') {
          return;
        }

        const pieceCopy = { ...piece, id: slug.nice() };
        pieces[pieceCopy.id] = pieceCopy;

        if (piece.type === 'deck') {
          Object.values(state.pieces).forEach((p) => {
            if (p.type === 'card' && p.deckId === pieceId) {
              const cardCopy = { ...p, id: slug.nice(), deckId: pieceCopy.id };
              pieces[cardCopy.id] = cardCopy;
            }
          });
        }
      });

      newScenario.pieces = Object.keys(pieces);
      newScenario.players = Object.values(pieces)
        .filter((piece) => piece.type === 'player')
        .map((piece) => piece.id);

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
      if (piece.type === 'player') {
        piece.name = `Player ${players.length}`;
      }
      return {
        ...state,
        renderCount: state.renderCount + 1,
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
        renderCount: state.renderCount + 1,
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
      const updatedScenario = {
        ...curScenario,
        pieces: curScenario.pieces.filter((pieceId) => pieceId !== id),
        players: curScenario.players.filter((pieceId) => pieceId !== id),
      };
      const pieces = { ...state.pieces };
      const deletedPiece = pieces[id];
      delete pieces[id];

      if (deletedPiece.type === 'player') {
        updatedScenario.players.forEach((pieceId, index) => {
          pieces[pieceId] = {
            ...pieces[pieceId],
            name: `Player ${index + 1}`,
          } as PlayerOption;
        });
      }

      return {
        ...state,
        pieces,
        renderCount: state.renderCount + 1,
        scenarios: {
          ...state.scenarios,
          [curScenario.id]: updatedScenario,
        },
      };
    }

    default:
      throw Error('unhandled EditorAction');
  }
}
