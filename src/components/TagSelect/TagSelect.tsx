import React from 'react';
import styled from 'styled-components';
import { FaRegTimesCircle } from 'react-icons/fa';
import { primaryColor } from '../../utils/style';

interface Props {
  tags: string[];
  onUpdate: (tags: string[]) => void;
}

const mechanics = ['Hidden Movement', 'Hidden Role', 'RPG'];

const theme = ['War', 'Fantasy'];

const Tag = styled.div({
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: primaryColor,
  color: '#fff',
  borderRadius: '4px',
  marginBottom: '.5rem',
  padding: '.25rem 1rem',
  paddingRight: '2rem',
});

const RemoveTagButton = styled(FaRegTimesCircle)({
  position: 'absolute',
  right: '.5rem',
  top: '.75rem',
  cursor: 'pointer',
});

export function TagSelect(props: Props) {
  const { tags, onUpdate } = props;

  return (
    <div>
      {tags.map(tag => (
        <Tag key={tag}>
          {tag}
          <RemoveTagButton
            onClick={() => onUpdate(tags.filter(t => t !== tag))}
          />
        </Tag>
      ))}

      <select
        className="u-full-width"
        onChange={e => {
          const tag = e.currentTarget.value;
          if (tag && !tags.includes(tag)) {
            onUpdate([...tags, tag]);
          }
        }}
      >
        <option value="">- Add Tag -</option>
        <optgroup label="Mechanic">
          {mechanics.map(x => (
            <option key={x}>{x}</option>
          ))}
        </optgroup>
        <optgroup label="Theme">
          {theme.map(x => (
            <option key={x}>{x}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
