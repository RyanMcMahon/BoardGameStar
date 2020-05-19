import styled from 'styled-components';

interface ButtonOptions {
  design: 'primary' | 'danger' | 'success';
}

export const primaryColor = '#6E48AA';
export const primaryHighlightColor = '#9D50BB';
export const dangerColor = '#e74c3c';
export const dangerHighlightColor = '#c0392b';
export const successColor = '#2ecc71';
export const successHighlightColor = '#27ae60';
export const disabledColor = '#ccc';

export const breakPoints = {
  mobile: '@media (max-width: 649px)',
  tablet: '@media (min-width: 650px) and (max-width: 900px)',
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
