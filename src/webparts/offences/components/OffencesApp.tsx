import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { ActionButton } from '@fluentui/react/lib/Button';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { ThemeProvider } from '@fluentui/react';
import { IConviction } from '../models';
import { IServices, reportError } from '../services';
import { S } from '../strings';
import { offencesTheme } from '../theme';
import { filterIndexes, normalize, tokenize } from '../utils/search';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { OffenceForm } from './OffenceForm';
import styles from './OffencesApp.module.scss';
import { OffencesTable } from './OffencesTable';
import { OffencesToolbar } from './OffencesToolbar';

export interface IOffencesAppProps {
  services: IServices;
  /** Name of the URL parameter with the Cases item ID. */
  caseIdParam: string;
  /** Name of the URL parameter with Cases.caseName. */
  caseNameParam: string;
  /** Web part property "תיק לבדיקה" (a case ID or a caseName). */
  testCase: string;
}

type CaseState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'error'; message: string }
  | { status: 'ready'; caseId: number };

type ItemsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: IConviction[] };

interface IFormState {
  /** Changes on every open, so the form remounts with fresh state. */
  key: number;
  isOpen: boolean;
  item?: IConviction;
}

// ThemeProvider paints its root with the theme's body background; the web part itself must stay
// transparent on the page (Panels, Callouts and Dialogs keep the white background).
const rootStyle: React.CSSProperties = { background: 'transparent' };

const Root: React.FC = ({ children }) => (
  <ThemeProvider theme={offencesTheme} applyTo="none" className={styles.root} style={rootStyle} dir="rtl">
    {children}
  </ThemeProvider>
);

export const OffencesApp: React.FC<IOffencesAppProps> = ({ services, caseIdParam, caseNameParam, testCase }) => {
  const [caseState, setCaseState] = React.useState<CaseState>({ status: 'loading' });
  const [itemsState, setItemsState] = React.useState<ItemsState>({ status: 'loading' });
  const [searchText, setSearchText] = React.useState('');
  const [lawFilter, setLawFilter] = React.useState('');
  const [form, setForm] = React.useState<IFormState>({ key: 0, isOpen: false });
  const [deleteTarget, setDeleteTarget] = React.useState<IConviction | undefined>(undefined);

  // Ignores the answer of a load that was overtaken by a newer one.
  const loadSeq = React.useRef(0);

  // 1. Resolve the open case ONCE (and again only if the settings that decide it change).
  React.useEffect(() => {
    let cancelled = false;
    setCaseState({ status: 'loading' });

    services.cases
      .resolveCase({ caseIdParam, caseNameParam, testCase })
      .then((resolution) => {
        if (cancelled) {
          return;
        }
        if (resolution.kind === 'found') {
          setCaseState({ status: 'ready', caseId: resolution.caseId });
        } else if (resolution.kind === 'notFound') {
          setCaseState({ status: 'error', message: resolution.message });
        } else {
          setCaseState({ status: 'none' });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCaseState({ status: 'error', message: reportError(err, S.errLoadCase) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [services, caseIdParam, caseNameParam, testCase]);

  // 2. Diagnostic only: compare config.ts laws with the real Choice values of lawSource.
  React.useEffect(() => {
    services.convictions.checkLawChoices().catch(() => undefined);
  }, [services]);

  const caseId = caseState.status === 'ready' ? caseState.caseId : undefined;

  const loadItems = React.useCallback(async (): Promise<void> => {
    if (caseId === undefined) {
      return;
    }
    const seq = ++loadSeq.current;
    setItemsState({ status: 'loading' });
    try {
      const items = await services.convictions.getForCase(caseId);
      if (seq === loadSeq.current) {
        setItemsState({ status: 'ready', items });
      }
    } catch (err) {
      if (seq === loadSeq.current) {
        setItemsState({ status: 'error', message: reportError(err, S.errLoadItems) });
      }
    }
  }, [services, caseId]);

  React.useEffect(() => {
    loadItems().catch((err) => console.error('[Offences] unexpected load error', err));
  }, [loadItems]);

  const refresh = (): void => {
    loadItems().catch((err) => console.error('[Offences] unexpected load error', err));
  };

  // The table search (law + section + details) and the law filter.
  const items = itemsState.status === 'ready' ? itemsState.items : undefined;
  const tokens = React.useMemo(() => tokenize(searchText), [searchText]);
  const visibleItems = React.useMemo(() => {
    if (!items) {
      return [];
    }
    const haystacks = items.map((item) => normalize(`${item.lawSource} ${item.section} ${item.details}`));
    return filterIndexes(haystacks, searchText)
      .map((index) => items[index])
      .filter((item) => lawFilter === '' || item.lawSource === lawFilter);
  }, [items, searchText, lawFilter]);

  const openAdd = (): void => setForm((current) => ({ key: current.key + 1, isOpen: true }));
  const openEdit = (item: IConviction): void => setForm((current) => ({ key: current.key + 1, isOpen: true, item }));
  const closeForm = (): void => setForm((current) => ({ ...current, isOpen: false }));

  // ---- states before the main screen ----
  if (caseState.status === 'loading') {
    return (
      <Root>
        <div className={styles.centered}>
          <Spinner size={SpinnerSize.large} label={S.loading} />
        </div>
      </Root>
    );
  }
  if (caseState.status === 'none') {
    return (
      <Root>
        <div className={styles.noCase}>{S.noCase}</div>
      </Root>
    );
  }
  if (caseState.status === 'error') {
    return (
      <Root>
        <MessageBar messageBarType={MessageBarType.error} isMultiline role="alert">
          {caseState.message}
        </MessageBar>
      </Root>
    );
  }

  // ---- main screen ----
  const renderBody = (): JSX.Element => {
    if (itemsState.status === 'loading') {
      return (
        <div className={styles.centered}>
          <Spinner size={SpinnerSize.large} label={S.loading} />
        </div>
      );
    }
    if (itemsState.status === 'error') {
      return (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline
          role="alert"
          actions={<ActionButton onClick={refresh}>{S.retry}</ActionButton>}
        >
          {itemsState.message}
        </MessageBar>
      );
    }
    if (visibleItems.length === 0) {
      return (
        <div className={styles.emptyBar}>
          <span>{itemsState.items.length === 0 ? S.emptyNoData : S.emptyNoMatch}</span>
          <Icon iconName="InfoSolid" className={styles.emptyIcon} aria-hidden="true" />
        </div>
      );
    }
    return (
      <OffencesTable
        items={visibleItems}
        tokens={tokens}
        onEdit={openEdit}
        onDelete={(item) => setDeleteTarget(item)}
      />
    );
  };

  return (
    <Root>
      <div className={styles.card}>
        <OffencesToolbar
          searchText={searchText}
          onSearchChange={setSearchText}
          lawFilter={lawFilter}
          onLawFilterChange={setLawFilter}
          onAdd={openAdd}
          onRefresh={refresh}
          busy={itemsState.status === 'loading'}
        />
        {renderBody()}
      </div>

      <OffenceForm
        key={form.key}
        isOpen={form.isOpen}
        caseId={caseState.caseId}
        item={form.item}
        services={services}
        onDismiss={closeForm}
        onSaved={() => {
          closeForm();
          refresh();
        }}
      />

      <DeleteConfirmDialog
        item={deleteTarget}
        services={services}
        onDismiss={() => setDeleteTarget(undefined)}
        onDeleted={() => {
          setDeleteTarget(undefined);
          refresh();
        }}
      />
    </Root>
  );
};
