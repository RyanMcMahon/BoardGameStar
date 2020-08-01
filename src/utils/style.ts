import styled from 'styled-components';

interface ButtonOptions {
  design: 'primary' | 'danger' | 'success';
  block?: boolean;
}

export const primaryColor = '#6E48AA';
export const primaryHighlightColor = '#9D50BB';
export const dangerColor = '#e74c3c';
export const dangerHighlightColor = '#c0392b';
export const successColor = '#2ecc71';
export const successHighlightColor = '#27ae60';
export const disabledColor = '#ccc';

export const theShadow = `0px 3px 7px rgba(0, 0, 0, 0.5)`;

export const maxMobileWidth = 650;
export const minTabletWidth = maxMobileWidth + 1;
export const maxTabletWidth = 900;
export const breakpoints = {
  mobile: `@media (max-width: ${maxMobileWidth}px)`,
  tablet: `@media (min-width: ${minTabletWidth}px) and (max-width: ${maxTabletWidth}px)`,
  desktop: `@media (min-width: ${maxTabletWidth}px)`,
};

const buttonStyles: {
  [key: string]: {
    base: string;
    highlight: string;
  };
} = {
  primary: {
    base: primaryColor,
    highlight: primaryHighlightColor,
  },
  danger: {
    base: dangerColor,
    highlight: dangerHighlightColor,
  },
  success: {
    base: successColor,
    highlight: successHighlightColor,
  },
};

export const Button = styled.button((options: ButtonOptions) => ({
  fontSize: '14px',
  textTransform: 'capitalize' as any,
  lineHeight: '36px',
  margin: 0,
  backgroundColor: buttonStyles[options.design].base,
  borderColor: buttonStyles[options.design].base,
  paddingLeft: '1.5rem',
  paddingRight: '1.5rem',
  color: '#fff',
  ...((options.block
    ? {
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '.5rem',
      }
    : {}) as any),
  ':disabled': {
    backgroundColor: disabledColor,
    borderColor: disabledColor,
    ':hover': {
      backgroundColor: disabledColor,
      borderColor: disabledColor,
      color: '#fff',
    },
  },
  ':focus': {
    color: '#fff',
  },
  ':active': {
    color: '#fff',
  },
  ':hover': {
    backgroundColor: buttonStyles[options.design].highlight,
    borderColor: buttonStyles[options.design].highlight,
    color: '#fff',
  },
}));

export const ButtonGroup = styled.div({
  display: 'inline-block',
  position: 'relative',
  button: {
    borderRadius: 0,
  },
  'button:first-child': {
    borderRadius: '4px 0 0 4px',
  },
  'button:last-child': {
    borderRadius: '0 4px 4px 0',
  },
});
