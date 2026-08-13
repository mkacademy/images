import React, { useEffect, useState } from 'react';
import { isPlainTextSlotValue } from '../../../library/imageUtils';
import { decodeMarkdownSlotText } from '../../../library/markdownSlotUtils';
import LinkifiedText from '../../LinkifiedText';
import MarkdownDocument from '../../markdown/MarkdownDocument';
import * as styles from '../../../styles/course.module.css';

type MarkdownExpandPaneProps = {
  imageurl: string;
  onClose: () => void;
};

const MarkdownExpandPane: React.FC<MarkdownExpandPaneProps> = ({
  imageurl,
  onClose,
}) => {
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState(false);
  const isPlainText = isPlainTextSlotValue(imageurl);
  const kindLabel = isPlainText ? 'text' : 'markdown';

  useEffect(() => {
    let cancelled = false;
    setDocumentText(null);
    setDecodeError(false);

    (async () => {
      const text = await decodeMarkdownSlotText(imageurl);
      if (cancelled) return;
      if (text == null) {
        setDecodeError(true);
        return;
      }
      setDocumentText(text);
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
        title={`Close ${kindLabel}`}
        aria-label={`Close ${kindLabel}`}
      >
        ×
      </button>
      {decodeError ? (
        <p className={styles['markdownExpandStatus']}>
          Could not decode this {kindLabel} document.
        </p>
      ) : documentText == null ? (
        <p className={styles['markdownExpandStatus']}>Loading {kindLabel}…</p>
      ) : isPlainText ? (
        <div className={`${styles['markdownExpandBody']} ${styles['markdownExpandPlain']}`}>
          <LinkifiedText text={documentText} />
        </div>
      ) : (
        <div className={styles['markdownExpandBody']}>
          <MarkdownDocument>{documentText}</MarkdownDocument>
        </div>
      )}
    </div>
  );
};

export default MarkdownExpandPane;
