import { Link } from '@/i18n/navigation';
import type { CtaButtonItem, LayoutCell } from '@/app/types';
import { pickLocaleString } from '@/lib/pick-locale';
import type { Locale } from '@/lib/pick-locale';
import { getCtaSettingsClasses, isInternalUrl } from './ctaSettings';
import { isSafeHref } from '@/lib/security/safe-href';

type CtaWidgetProps = {
  cell: LayoutCell;
  fullWidth?: boolean;
  locale?: Locale;
};

function CtaButtonLink({
  label,
  url,
  openInNewTab,
  className,
}: {
  label: string;
  url: string;
  openInNewTab?: boolean;
  className: string;
}) {
  if (!isSafeHref(url)) return null;

  const external = !isInternalUrl(url) || openInNewTab;

  if (external) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={url} className={className}>
      {label}
    </Link>
  );
}

export function CtaWidget({ cell, locale = 'id' }: CtaWidgetProps) {
  const payload = cell.payload as {
    buttons?: CtaButtonItem[];
    align?: 'left' | 'center' | 'right';
    direction?: 'row' | 'column';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    gap?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
  };

  const buttons = (payload.buttons ?? [])
    .map((button) => {
      const label = pickLocaleString(button.label ?? '', button.labelEn ?? undefined, locale).trim();
      const url = (button.url ?? '').trim();
      if (!label || !url || !isSafeHref(url)) return null;
      return { ...button, label, url };
    })
    .filter((button): button is CtaButtonItem & { label: string; url: string } => button !== null);

  if (buttons.length === 0) return null;

  const { containerClassName, buttonClassName, buttonWidthClassName } = getCtaSettingsClasses(payload);

  return (
    <div className={containerClassName}>
      {buttons.map((button) => (
        <CtaButtonLink
          key={button.id}
          label={button.label}
          url={button.url}
          openInNewTab={button.openInNewTab}
          className={`${buttonClassName} ${buttonWidthClassName}`.trim()}
        />
      ))}
    </div>
  );
}
