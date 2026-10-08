import * as React from 'react';
import { ActionButton } from '@fluentui/react/lib/Button';
import { Callout, DirectionalHint } from '@fluentui/react/lib/Callout';
import { Icon } from '@fluentui/react/lib/Icon';
import { Label } from '@fluentui/react/lib/Label';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { getId } from '@fluentui/react/lib/Utilities';
import { findLaw } from '../config';
import { ISection } from '../models';
import { LawSectionsService, reportError } from '../services';
import { S } from '../strings';
import { normalize, rankIndexes, tokenize } from '../utils/search';
import { HighlightedText } from './HighlightedText';
import styles from './OffenceForm.module.scss';

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; sections: ISection[] }
  | { status: 'error'; message: string };

const NO_SECTIONS: ISection[] = [];

export interface ISectionPickerProps {
  /** Selected Convictions.lawSource, or '' when no law is chosen yet. */
  law: string;
  /** Current section text (plain copied text), or ''. */
  value: string;
  sectionsService: LawSectionsService;
  onChange: (sectionText: string) => void;
  /** Shown under the field, e.g. "שדה חובה". */
  errorMessage?: string;
}

interface IOptionProps {
  id: string;
  label: string;
  tokens: string[];
  selected: boolean;
  active: boolean;
  onSelect: (label: string) => void;
}

// Memoized: with ~780 sections, moving the keyboard cursor must only re-render two rows.
const SectionOption = React.memo<IOptionProps>(({ id, label, tokens, selected, active, onSelect }) => (
  <div
    id={id}
    role="option"
    aria-selected={selected}
    className={[styles.option, active ? styles.optionActive : '', selected ? styles.optionSelected : ''].join(' ')}
    // Keep the focus in the search box when clicking an option.
    onMouseDown={(event) => event.preventDefault()}
    onClick={() => onSelect(label)}
  >
    <span className={styles.optionCheck} aria-hidden="true">
      {selected ? <Icon iconName="CheckMark" /> : null}
    </span>
    <span>
      <HighlightedText text={label} tokens={tokens} />
    </span>
  </div>
));
SectionOption.displayName = 'SectionOption';

/**
 * Section picker. Disabled until a law is chosen; then it loads the law's sections and lists all of
 * them in a scrollable popup with a smart-search box (utils/search), not Fluent's prefix-only filter.
 */
export const SectionPicker: React.FC<ISectionPickerProps> = ({ law, value, sectionsService, onChange, errorMessage }) => {
  const knownLaw = law !== '' && findLaw(law) !== undefined;
  const ids = React.useRef({ button: getId('sectionButton'), list: getId('sectionList') });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const [load, setLoad] = React.useState<LoadState>({ status: 'idle' });
  const [reloadTick, setReloadTick] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const [popupWidth, setPopupWidth] = React.useState(320);

  // A different law: close the popup and forget the query.
  React.useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [law]);

  // Load the sections of the chosen law (cached per law in the service). Also runs on "retry".
  React.useEffect(() => {
    if (!knownLaw) {
      setLoad({ status: 'idle' });
      return undefined;
    }

    let cancelled = false;
    setLoad({ status: 'loading' });
    sectionsService
      .getSections(law)
      .then((sections) => {
        if (!cancelled) {
          setLoad({ status: 'ready', sections });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoad({ status: 'error', message: reportError(err, S.errLoadSections) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [law, knownLaw, reloadTick, sectionsService]);

  const sections = load.status === 'ready' ? load.sections : NO_SECTIONS;
  const normalizedLabels = React.useMemo(() => sections.map((section) => normalize(section.label)), [sections]);
  const tokens = React.useMemo(() => tokenize(query), [query]);
  const order = React.useMemo(() => rankIndexes(normalizedLabels, query), [normalizedLabels, query]);

  const legacyValue = value !== '' && load.status === 'ready' && !sections.some((section) => section.label === value);

  const optionId = (position: number): string => `${ids.current.list}-${position}`;

  const choose = React.useCallback(
    (label: string) => {
      onChange(label);
      setOpen(false);
      setQuery('');
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    },
    [onChange]
  );

  const toggle = (): void => {
    if (open) {
      setOpen(false);
      return;
    }
    if (triggerRef.current) {
      setPopupWidth(Math.max(280, triggerRef.current.offsetWidth));
    }
    setQuery('');
    const selected = sections.findIndex((section) => section.label === value);
    setActive(selected >= 0 ? selected : 0); // with an empty query `order` is the source order
    setOpen(true);
  };

  // Keep the keyboard cursor visible.
  React.useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }
    const element = document.getElementById(optionId(active));
    if (element && element.scrollIntoView) {
      element.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active, order]);

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.min(order.length - 1, current + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    }
  };

  // Fluent's SearchBox swallows Enter unless onSearch is given, so Enter is handled here.
  const chooseActive = (): void => {
    const index = order[active];
    if (index !== undefined) {
      choose(sections[index].label);
    }
  };

  const disabled = !knownLaw;
  const hasValue = value !== '';

  const renderPopupBody = (): JSX.Element => {
    if (load.status === 'loading' || load.status === 'idle') {
      return (
        <div className={styles.popupState}>
          <Spinner size={SpinnerSize.medium} label={S.sectionsLoading} labelPosition="right" />
        </div>
      );
    }
    if (load.status === 'error') {
      return (
        <div>
          <MessageBar messageBarType={MessageBarType.error} isMultiline>
            {load.message}
          </MessageBar>
          <ActionButton iconProps={{ iconName: 'Refresh' }} onClick={() => setReloadTick((tick) => tick + 1)}>
            {S.retry}
          </ActionButton>
        </div>
      );
    }
    return (
      <>
        <div className={styles.popupMeta} aria-live="polite">
          {order.length === 0 ? S.sectionsNoResults : S.sectionsCount(order.length, sections.length)}
        </div>
        <div className={styles.list} role="listbox" id={ids.current.list} ref={listRef} aria-label={S.sectionLabel}>
          {order.length === 0 ? (
            <div className={styles.noResults}>{S.sectionsNoResults}</div>
          ) : (
            order.map((index, position) => (
              <SectionOption
                key={sections[index].id}
                id={optionId(position)}
                label={sections[index].label}
                tokens={tokens}
                selected={sections[index].label === value}
                active={position === active}
                onSelect={choose}
              />
            ))
          )}
        </div>
      </>
    );
  };

  return (
    <div className={styles.field}>
      <Label required htmlFor={ids.current.button} disabled={disabled}>
        {S.sectionLabel}
      </Label>

      <button
        type="button"
        id={ids.current.button}
        ref={triggerRef}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? ids.current.list : undefined}
        aria-required="true"
        aria-invalid={errorMessage ? true : undefined}
        disabled={disabled}
        className={[styles.pickerButton, errorMessage ? styles.pickerInvalid : '', open ? styles.pickerOpen : ''].join(' ')}
        onClick={toggle}
        title={hasValue ? value : undefined}
      >
        <span className={`${styles.pickerValue} ${hasValue ? '' : styles.pickerPlaceholder}`}>
          {hasValue ? value : knownLaw ? S.sectionPlaceholder : S.sectionNeedsLaw}
        </span>
        <Icon iconName="ChevronDown" className={styles.pickerChevron} aria-hidden="true" />
      </button>

      {errorMessage && (
        <div className={styles.fieldError} role="alert">
          {errorMessage}
        </div>
      )}
      {legacyValue && (
        <div className={styles.hint}>
          <Icon iconName="Info" className={styles.hintIcon} aria-hidden="true" />
          <span>{S.sectionLegacyHint}</span>
        </div>
      )}
      {law !== '' && !knownLaw && (
        <div className={styles.hint}>
          <Icon iconName="Info" className={styles.hintIcon} aria-hidden="true" />
          <span>{S.sectionLawUnknownHint}</span>
        </div>
      )}

      {open && (
        <Callout
          target={triggerRef}
          onDismiss={() => setOpen(false)}
          directionalHint={DirectionalHint.bottomAutoEdge}
          isBeakVisible={false}
          gapSpace={2}
          setInitialFocus
          calloutWidth={popupWidth}
          styles={{ calloutMain: { borderRadius: 8 } }}
        >
          <div className={styles.popup}>
            <SearchBox
              autoFocus
              placeholder={S.sectionSearchPlaceholder}
              ariaLabel={S.sectionSearchPlaceholder}
              value={query}
              role="combobox"
              aria-expanded="true"
              aria-controls={ids.current.list}
              aria-activedescendant={order.length > 0 ? optionId(active) : undefined}
              onChange={(_event, newValue) => {
                setQuery(newValue || '');
                setActive(0);
              }}
              onClear={() => {
                setQuery('');
                setActive(0);
              }}
              onKeyDown={onSearchKeyDown}
              onSearch={chooseActive}
            />
            {renderPopupBody()}
          </div>
        </Callout>
      )}
    </div>
  );
};
