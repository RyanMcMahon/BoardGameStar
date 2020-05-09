import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';

interface Props {
  release: any;
  onClose: () => void;
}

const Wrapper = styled.div({
  padding: '2rem',
});

const UpdateHeader = styled.h1({
  fontSize: '3rem',
  margin: 0,
  padding: 0,
});

export function UpdateModal(props: Props) {
  return (
    <Modal onClose={props.onClose}>
      <Wrapper>
        <UpdateHeader>Update Available: {props.release.tag_name}</UpdateHeader>
        {props.release.assets.map((asset: any) => (
          <div key={asset.id}>
            <a href={asset.browser_download_url}>{asset.name}</a>
            <br />
          </div>
        ))}
      </Wrapper>
    </Modal>
  );
}
