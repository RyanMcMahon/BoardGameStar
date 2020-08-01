import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';

import { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
  onSubmit: (transaction: Transaction, amount: number) => void;
  onClose: () => void;
}

const Wrapper = styled.div({
  input: {
    marginBottom: '.5rem',
  },
});

export function TransactionModal(props: Props) {
  const { onClose, onSubmit, transactions } = props;
  const [form, setForm] = React.useState<{
    transaction: Transaction;
    amount: number;
  }>({
    transaction: transactions[0],
    amount: 1,
  });

  const handleSubmit = () => {
    onSubmit(form.transaction, form.amount);
  };

  return (
    <Modal onClose={onClose}>
      <Modal.Content>
        <Modal.Title>Transaction</Modal.Title>
        <Wrapper>
          <form onSubmit={handleSubmit}>
            <select
              className="u-full-width"
              onChange={e => {
                const transaction =
                  transactions[parseInt(e.currentTarget.value, 10)];
                setForm(f => ({ ...f, transaction }));
              }}
            >
              {transactions.map((transaction, index) => (
                <option key={index} value={index}>
                  {transaction.from.name} -&gt; {transaction.to.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              className="u-full-width"
              max={form.transaction.from.max}
              min={1}
              value={form.amount}
              placeholder="Amount"
              onChange={e => {
                const amount = parseInt(e.currentTarget.value, 10);
                setForm(f => ({ ...f, amount }));
              }}
            />
          </form>
          {/* <Button
            block={true}
            design="primary"
            onClick={() =>
              setForm(f => ({ ...f, amount: f.transaction.from.max }))
            }
          >
            Max ({form.transaction.from.max})
          </Button> */}
          <Button block={true} design="success" onClick={handleSubmit}>
            Submit
          </Button>
        </Wrapper>
      </Modal.Content>
    </Modal>
  );
}
