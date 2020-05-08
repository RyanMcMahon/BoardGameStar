import styled from 'styled-components';

interface ButtonOptions {
  design: 'primary' | 'danger';
}

export const primaryColor = '#6E48AA';
export const primaryHighlightColor = '#9D50BB';
export const dangerColor = '#e74c3c';
export const dangerHighlightColor = '#c0392b';
export const disabledColor = '#ccc';

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
};

export const Button = styled.button((options: ButtonOptions) => ({
  fontSize: '14px',
  textTransform: 'capitalize' as any,
  lineHeight: '36px',
  margin: 0,
  backgroundColor: buttonStyles[options.design].base,
  borderColor: buttonStyles[options.design].base,
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
  ':hover': {
    backgroundColor: buttonStyles[options.design].highlight,
    borderColor: buttonStyles[options.design].highlight,
    color: '#fff',
  },
}));
