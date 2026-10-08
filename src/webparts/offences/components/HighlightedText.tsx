import * as React from 'react';
import { highlightSegments } from '../utils/search';
import styles from './OffencesApp.module.scss';

export interface IHighlightedTextProps {
  text: string;
  /** Normalized search tokens (see utils/search.tokenize). */
  tokens: string[];
}

/** Renders text with the matched parts wrapped in <mark>. */
export const HighlightedText: React.FC<IHighlightedTextProps> = ({ text, tokens }) => {
  const segments = React.useMemo(() => highlightSegments(text, tokens), [text, tokens]);
  return (
    <>
      {segments.map((segment, index) =>
        segment.highlight ? (
          <mark key={index} className={styles.mark}>
            {segment.text}
          </mark>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        )
      )}
    </>
  );
};
