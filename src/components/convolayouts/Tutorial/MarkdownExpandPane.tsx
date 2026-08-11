import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { decodeMarkdownSlotText } from '../../../library/markdownSlotUtils';
import * as styles from '../../../styles/course.module.css';

type MarkdownExpandPaneProps = {
  imageurl: string;
  onClose: () => void;
};

const MarkdownExpandPane: React.FC<MarkdownExpandPaneProps> = ({
  imageurl,
  onClose,
}) => {
  const [markdownText, setMarkdownText] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMarkdownText(null);
    setDecodeError(false);

    (async () => {
      const text = await decodeMarkdownSlotText(imageurl);
      if (cancelled) return;
      if (text == null) {
        setDecodeError(true);
        return;
      }
      setMarkdownText(text);
    })();

    return () => {
      cancelled = true;
    };
  }, [imageurl]);

  const closeHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
    onClose();
  };

  return (
    <div className={styles['markdownExpandPane']}>
      <button
        type="button"
        className={styles['markdownExpandClose']}
        onClick={closeHandler}
        title="Close markdown"
        aria-label="Close markdown"
      >
        ×
      </button>
      {decodeError ? (
        <p className={styles['markdownExpandStatus']}>
          Could not decode this markdown document.
        </p>
      ) : markdownText == null ? (
        <p className={styles['markdownExpandStatus']}>Loading markdown…</p>
      ) : (
        <div className={styles['markdownExpandBody']}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownText}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default MarkdownExpandPane;
