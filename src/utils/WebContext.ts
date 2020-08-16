import React from 'react';

interface State {
  errorMessage: string;
}

interface ErrorAction {
  type: 'error';
  errorMessage: string;
}

type Action = ErrorAction;

interface WebContext {
  state: State;
  dispatch: React.Dispatch<Action>; // TODO
  alertError: (errorMessage: string) => void;
}

const initialState = { errorMessage: '' };

export const WebContext = React.createContext<WebContext>({} as WebContext);
export const useWebContext = () => React.useContext(WebContext);

export const webReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'error': {
      return {
        ...state,
        errorMessage: action.errorMessage,
      };
    }

    default:
      return state;
  }
};

export const useWebReducer = () => {
  const [state, dispatch] = React.useReducer(webReducer, initialState);

  const alertError = (errorMessage: string) => {
    dispatch({
      errorMessage,
      type: 'error',
    });
    setTimeout(
      () =>
        dispatch({
          errorMessage: '',
          type: 'error',
        }),
      2400
    );
  };

  return {
    state,
    dispatch,
    alertError,
  };
};
