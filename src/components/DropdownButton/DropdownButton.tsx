import React, { Children } from 'react';
import {
  ButtonGroup,
  Button,
  primaryColor,
  theShadow,
} from '../../utils/style';
import styled from 'styled-components';

interface DropdownButtonItem {
  label: string;
  fn: () => void;
}

interface Props {
  disabled: boolean;
  children: React.ReactNode;
  items: DropdownButtonItem[];
}

const DropdownContainer = styled.div({
  position: 'relative',
  display: 'inline-block',
});

const Dropdown = styled.div({
  position: 'absolute',
  top: '100%',
  left: 0,
  backgroundColor: '#fff',
  boxShadow: theShadow,
  width: '140px',
  zIndex: 3000,
  borderRadius: '4px',
  '> div': {
    cursor: 'pointer',
    fontWeight: 'bold',
    padding: '.5rem 1rem',
    ':hover': {
      color: primaryColor,
    },
  },
});

export function DropdownButton(props: Props) {
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <DropdownContainer>
      <ButtonGroup>
        {props.children}
        <Button
          design="primary"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={props.disabled}
        >
          &#x2BC6;
        </Button>
      </ButtonGroup>
      {showDropdown && (
        <Dropdown>
          {props.items.map(item => (
            <div
              key={item.label}
              onClick={() => {
                setShowDropdown(false);
                item.fn();
              }}
            >
              {item.label}
            </div>
          ))}
        </Dropdown>
      )}
    </DropdownContainer>
  );
}
