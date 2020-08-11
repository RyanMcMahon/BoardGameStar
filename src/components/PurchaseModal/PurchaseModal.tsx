import React, { FormEvent } from 'react';

import { Button } from '../../utils/style';
import { getCustomerData, buyGame } from '../../utils/api';
import { Modal } from '../Modal';

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import styled from 'styled-components';
import { FaCheck } from 'react-icons/fa';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.

interface Props {
  game: any;
  onClose: () => void;
}

const ModalContent = styled(Modal.Content)({
  width: '350px',
});

const CreditCard = styled(CardElement)({
  border: `1px solid #ccc`,
  borderRadius: '4px',
  padding: '.5rem',
  margin: '0',
});

const CheckoutLabel = styled.label({
  marginBottom: '2rem',
});

const CheckoutInput = styled.input({
  marginBottom: 0,
});

const CheckoutTip = styled.em({
  color: '#777',
});

const TipRow = styled.div({
  display: 'flex',
  flexDirection: 'row',
});

const TipButton = styled(Button)({
  marginLeft: '.5rem',
});

const TipInputWrapper = styled.div({
  // marginRight: '1rem',
});

const TipInput = styled.input({
  marginBottom: 0,
  width: '100%',
});

const Total = styled.h3({
  fontSize: '2rem',
  marginTop: '1rem',
  textAlign: 'center',
});

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      // fontSmoothing: 'antialiased',
      fontSize: '18px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

export function PurchaseModal(props: Props) {
  const { game, onClose } = props;
  const stripe = useStripe();
  const elements = useElements();
  // const currentUser = useUser();
  const [form, setForm] = React.useState<{
    cardholderName: string;
    cardholderEmail: string;
    tip: number;
    tipSplit: number;
  }>({
    cardholderName: '',
    cardholderEmail: '',
    tip: 0,
    tipSplit: 1,
  });
  const tax = 0; // TODO

  const [customerData, setCustomerData] = React.useState<{
    setup_secret: string;
  }>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();

    if (!stripe || !elements || !customerData) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement) as any,
        billing_details: {
          name: form.cardholderName,
          email: form.cardholderEmail,
        },
      });

      // TODO error or not paymentMethod
      if (error) {
        throw error;
      }

      if (paymentMethod) {
        await buyGame(game, paymentMethod, form.tip, tax);
      }
    } catch (err) {}
  };

  React.useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const customerData = await getCustomerData();
        if (customerData) {
          setCustomerData(customerData as any);
        }
      } catch (err) {}
    };
    loadCustomerData();
  }, []);

  return (
    <Modal onClose={onClose}>
      <ModalContent>
        <Modal.Title>Buy {game.config.name}</Modal.Title>
        <form onSubmit={handleSubmit}>
          {/* Cardholder Name */}
          <CheckoutLabel>
            <strong>Cardholder Name</strong>
            <CheckoutInput
              className="u-full-width"
              type="text"
              placeholder="Cardholder Name"
              onChange={e => {
                const cardholderName = e.currentTarget.value;
                setForm(f => ({ ...f, cardholderName }));
              }}
            />
          </CheckoutLabel>
          {/* Cardholder Email */}
          <CheckoutLabel>
            <strong>Cardholder Email</strong>
            <CheckoutInput
              className="u-full-width"
              type="text"
              placeholder="Cardholder Email"
              onChange={e => {
                const cardholderEmail = e.currentTarget.value;
                setForm(f => ({ ...f, cardholderEmail }));
              }}
            />
            <CheckoutTip>
              Your email will only be used during the purchase process
            </CheckoutTip>
          </CheckoutLabel>
          {/* Cardholder Details */}
          <CheckoutLabel>
            <strong>Card details</strong>
            <CreditCard options={CARD_ELEMENT_OPTIONS} />
            <CheckoutTip>
              Your card information is sent securely to our payment processor
              and never stored on our server
            </CheckoutTip>
          </CheckoutLabel>
          {/* Tip */}
          <CheckoutLabel>
            <strong>Tip</strong>
            <TipRow>
              <TipInputWrapper>
                <TipInput
                  type="number"
                  placeholder="Thank You!"
                  value={form.tip > 0 ? form.tip / 100 : undefined}
                  onChange={e => {
                    const tip = (parseFloat(e.currentTarget.value) || 0) * 100;
                    setForm(f => ({ ...f, tip }));
                  }}
                />
              </TipInputWrapper>
              <TipButton
                design="primary"
                onClick={e => {
                  e.preventDefault();
                  setForm(f => ({ ...f, tip: f.tip + 100 }));
                }}
              >
                +$1
              </TipButton>
              <TipButton
                design="primary"
                onClick={e => {
                  e.preventDefault();
                  setForm(f => ({ ...f, tip: f.tip + 200 }));
                }}
              >
                +$2
              </TipButton>
              <TipButton
                design="primary"
                onClick={e => {
                  e.preventDefault();
                  setForm(f => ({ ...f, tip: f.tip + 500 }));
                }}
              >
                +$5
              </TipButton>
            </TipRow>
            <CheckoutTip>
              100% of your tip will go to {'TODO'} so they can continue making
              great games like {game.config.name}!
            </CheckoutTip>
          </CheckoutLabel>

          <Button design="success" block disabled={!stripe}>
            <FaCheck />
            &nbsp; Purchase
          </Button>

          <Total>
            ${((game.price + form.tip) / 100).toFixed(2)} will be charged to
            your card.
          </Total>
        </form>
      </ModalContent>
    </Modal>
  );
}
