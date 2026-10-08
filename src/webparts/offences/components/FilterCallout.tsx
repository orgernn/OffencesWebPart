import * as React from 'react';
import { Callout, DirectionalHint } from '@fluentui/react/lib/Callout';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { LAWS } from '../config';
import { S } from '../strings';
import { lawDropdownStyles } from '../theme';
import styles from './OffencesApp.module.scss';
import { renderCheckOption } from './LawOption';

const ALL_KEY = '__all__';

const options: IDropdownOption[] = [{ key: ALL_KEY, text: S.filterAllLaws }].concat(
  LAWS.map((law) => ({ key: law.lawSource, text: law.lawSource }))
);

export interface IFilterCalloutProps {
  target: React.RefObject<HTMLElement>;
  /** Selected lawSource, or '' for all laws. */
  value: string;
  onChange: (lawSource: string) => void;
  onDismiss: () => void;
}

/** Callout opened by the filter button: a law dropdown that includes "כל החוקים". */
export const FilterCallout: React.FC<IFilterCalloutProps> = ({ target, value, onChange, onDismiss }) => (
  <Callout
    target={target}
    onDismiss={onDismiss}
    directionalHint={DirectionalHint.bottomAutoEdge}
    isBeakVisible={false}
    gapSpace={4}
    setInitialFocus
    role="dialog"
    ariaLabel={S.filterTooltip}
  >
    <div className={styles.filterBody}>
      <Dropdown
        label={S.filterLawLabel}
        options={options}
        selectedKey={value === '' ? ALL_KEY : value}
        onRenderOption={(option) => renderCheckOption(option, value === '' ? ALL_KEY : value)}
        styles={lawDropdownStyles}
        onChange={(_event, option) => {
          if (option) {
            onChange(option.key === ALL_KEY ? '' : String(option.key));
          }
        }}
      />
    </div>
  </Callout>
);
