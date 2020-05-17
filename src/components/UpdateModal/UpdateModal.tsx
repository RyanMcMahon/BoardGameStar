import React from 'react';

import { Modal } from '../Modal';

interface Props {
  release: any;
  onClose: () => void;
}

export function UpdateModal(props: Props) {
  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Update Available: {props.release.tag_name}</Modal.Title>
        {props.release.assets.map((asset: any) => (
          <div key={asset.id}>
            <a href={asset.browser_download_url}>{asset.name}</a>
            <br />
          </div>
        ))}
      </Modal.Content>
    </Modal>
  );
}
