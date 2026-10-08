import * as React from 'react';
import { IconButton } from '@fluentui/react/lib/Button';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import { IConviction } from '../models';
import { S } from '../strings';
import { iconButtonStyles } from '../theme';
import { HighlightedText } from './HighlightedText';
import styles from './OffencesApp.module.scss';

export interface IOffencesTableProps {
  items: IConviction[];
  /** Normalized search tokens, used to highlight matches. */
  tokens: string[];
  onEdit: (item: IConviction) => void;
  onDelete: (item: IConviction) => void;
}

/**
 * Law | Section | Details | actions. In RTL the first column is at the right and the actions column
 * is the last one, so it ends up at the left.
 */
export const OffencesTable: React.FC<IOffencesTableProps> = ({ items, tokens, onEdit, onDelete }) => (
  <div className={styles.tableWrap}>
    <table className={styles.table} aria-label={S.tableLabel}>
      <colgroup>
        <col style={{ width: '20%' }} />
        <col style={{ width: '32%' }} />
        <col />
        <col style={{ width: 92 }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className={styles.th}>
            {S.colLaw}
          </th>
          <th scope="col" className={styles.th}>
            {S.colSection}
          </th>
          <th scope="col" className={styles.th}>
            {S.colDetails}
          </th>
          <th scope="col" className={styles.th}>
            <span className={styles.srOnly}>{S.colActions}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className={styles.row}>
            <td className={styles.td}>
              <HighlightedText text={item.lawSource} tokens={tokens} />
            </td>
            <td className={styles.td}>
              <HighlightedText text={item.section} tokens={tokens} />
            </td>
            <td className={`${styles.td} ${styles.details}`}>
              <HighlightedText text={item.details} tokens={tokens} />
            </td>
            <td className={`${styles.td} ${styles.actionsCell}`}>
              <div className={styles.rowActions}>
                <TooltipHost content={S.editTooltip}>
                  <IconButton
                    styles={iconButtonStyles}
                    iconProps={{ iconName: 'Edit' }}
                    ariaLabel={`${S.editTooltip}: ${item.section}`}
                    onClick={() => onEdit(item)}
                  />
                </TooltipHost>
                <TooltipHost content={S.deleteTooltip}>
                  <IconButton
                    styles={iconButtonStyles}
                    iconProps={{ iconName: 'Delete' }}
                    ariaLabel={`${S.deleteTooltip}: ${item.section}`}
                    onClick={() => onDelete(item)}
                  />
                </TooltipHost>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
