import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const initialState = {
  globalDragEnabled: true,
};

export const AppContext = React.createContext<any>({
  state: initialState,
  dispatch: () => null,
});

export const useAppContext = () => React.useContext(AppContext);

export function appReducer(state: any, action: any) {
  switch (action.type) {
    case 'enable_drag': {
      return {
        ...state,
        globalDragEnabled: true,
      };
    }

    case 'disable_drag': {
      return {
        ...state,
        globalDragEnabled: false,
      };
    }

    default:
      return state;
  }
}
