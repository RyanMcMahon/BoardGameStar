import React, { ReactNode } from 'react';
import styled from 'styled-components';

import { maxMobileWidth, theShadow } from '../../utils/style';

export interface ControlsMenuItem {
  icon: ReactNode;
  label: string;
  fn: () => void;
}

interface Props {
  items: ControlsMenuItem[];
}

const ControlsContainer = styled.div({
  position: 'absolute',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 500,
  backgroundColor: '#fff',
  borderRadius: '0 4px 4px 0',
  boxShadow: theShadow,
  padding: '.5rem 0',
});

const ControlsItem = styled.div({
  cursor: 'pointer',
  padding: '.5rem 1rem',
  fontSize: '2rem',
  userSelect: 'none',
  ':hover': {
    backgroundColor: '#eee',
  },
});

const Icon = styled.span({
  display: 'inline-block',
  width: '30px',
  marginRight: '.5rem',
  textAlign: 'center',
  position: 'relative',
  top: '3px',
});

const ExpandIcon = styled.span({
  position: 'relative',
  fontSize: '4rem',
  lineHeight: '2rem',
  top: '3px',
  left: '9px',
  marginRight: '23px',
});

export function ControlsMenu(props: Props) {
  const { items } = props;
  const [isExpanded, setIsExpanded] = React.useState(true);

  React.useLayoutEffect(() => {
    if (window.innerWidth < maxMobileWidth) {
      setIsExpanded(false);
    }
  }, []);

  return (
    <ControlsContainer>
      <ControlsItem onClick={() => setIsExpanded(!isExpanded)}>
        <ExpandIcon> {isExpanded ? <>&lsaquo;</> : <>&rsaquo;</>}</ExpandIcon>
        {isExpanded && <>Collapse</>}
      </ControlsItem>
      {items.map(item => (
        <ControlsItem key={item.label} onClick={item.fn}>
          <Icon>{item.icon}</Icon>
          {isExpanded && <>{item.label}</>}
        </ControlsItem>
      ))}
    </ControlsContainer>
  );
}
