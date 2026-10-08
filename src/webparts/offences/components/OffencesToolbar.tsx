import * as React from 'react';
import { IconButton } from '@fluentui/react/lib/Button';
import { Icon } from '@fluentui/react/lib/Icon';
import { ISearchBoxStyles, SearchBox } from '@fluentui/react/lib/SearchBox';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import { PRIMARY_COLOR } from '../config';
import { S } from '../strings';
import { iconButtonStyles } from '../theme';
import { FilterCallout } from './FilterCallout';
import styles from './OffencesApp.module.scss';

export interface IOffencesToolbarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  lawFilter: string;
  onLawFilterChange: (lawSource: string) => void;
  onAdd: () => void;
  onRefresh: () => void;
  /** Disables refresh while a load is in flight. */
  busy: boolean;
}

// Pill-shaped search box. Fluent's own magnifier is hidden: the reference draws it outside the box.
const searchBoxStyles: ISearchBoxStyles = {
  root: {
    height: 36,
    borderRadius: 18,
    border: '1px solid #c8c8c8',
    backgroundColor: '#fff',
    selectors: {
      ':hover': { borderColor: '#8a8886' },
      '::after': { borderRadius: 18, borderColor: PRIMARY_COLOR }
    }
  },
  iconContainer: { display: 'none' },
  field: { padding: '0 14px', fontSize: 14 },
  clearButton: { marginInlineEnd: 4 }
};

export const OffencesToolbar: React.FC<IOffencesToolbarProps> = (props) => {
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterAnchor = React.useRef<HTMLSpanElement>(null);

  return (
    <div className={styles.toolbar}>
      {/* At the right in RTL: magnifier + search box */}
      <div className={styles.searchGroup} role="search">
        <Icon iconName="Search" className={styles.searchIcon} aria-hidden="true" />
        <SearchBox
          className={styles.searchBox}
          styles={searchBoxStyles}
          placeholder={S.searchPlaceholder}
          ariaLabel={S.searchPlaceholder}
          value={props.searchText}
          onChange={(_event, value) => props.onSearchChange(value || '')}
          onClear={() => props.onSearchChange('')}
        />
      </div>

      {/* At the left in RTL. DOM order add, refresh, filter reads filter, refresh, add from left to right. */}
      <div className={styles.actions}>
        <TooltipHost content={S.addTooltip}>
          <IconButton
            styles={iconButtonStyles}
            iconProps={{ iconName: 'Add' }}
            ariaLabel={S.addTooltip}
            onClick={props.onAdd}
          />
        </TooltipHost>
        <TooltipHost content={S.refreshTooltip}>
          <IconButton
            styles={iconButtonStyles}
            iconProps={{ iconName: 'Refresh' }}
            ariaLabel={S.refreshTooltip}
            disabled={props.busy}
            onClick={props.onRefresh}
          />
        </TooltipHost>
        <span ref={filterAnchor} className={styles.anchor}>
          <TooltipHost content={S.filterTooltip}>
            <IconButton
              styles={iconButtonStyles}
              // Three decreasing lines, as on the case page (MDL2's "Filter" is a funnel).
              iconProps={{ iconName: 'SortLines' }}
              ariaLabel={S.filterTooltip}
              checked={props.lawFilter !== ''}
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((open) => !open)}
            />
          </TooltipHost>
        </span>
      </div>

      {filterOpen && (
        <FilterCallout
          target={filterAnchor}
          value={props.lawFilter}
          onChange={props.onLawFilterChange}
          onDismiss={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
};
