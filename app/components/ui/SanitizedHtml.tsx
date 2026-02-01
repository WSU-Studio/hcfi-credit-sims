'use client';

import { useState, useEffect } from 'react';

const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'span',
];
const DEFAULT_ALLOWED_ATTR = ['href', 'target', 'rel'];

type SanitizedHtmlProps = {
  html: string;
  allowedTags?: string[];
  allowedAttr?: string[];
  className?: string;
};

export function SanitizedHtml({
  html,
  allowedTags = DEFAULT_ALLOWED_TAGS,
  allowedAttr = DEFAULT_ALLOWED_ATTR,
  className,
}: SanitizedHtmlProps) {
  const [sanitized, setSanitized] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    import('isomorphic-dompurify').then((mod) => {
      const DOMPurify = mod.default;
      if (!cancelled) {
        setSanitized(
          DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: allowedAttr })
        );
      }
    });
    return () => { cancelled = true; };
  }, [html, allowedTags, allowedAttr]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
