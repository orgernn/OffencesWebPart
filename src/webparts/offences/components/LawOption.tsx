import * as React from 'react';
import { IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './OffenceForm.module.scss';

/**
 * Dropdown item with a check mark in front of the selected one
 * (as in 02_law_dropdown_reference.png). The empty slot keeps the other items aligned.
 * A single-select Dropdown does not set option.selected, so the selected key is passed in.
 */
export function renderCheckOption(option: IDropdownOption | undefined, selectedKey: string | number | undefined): JSX.Element {
  if (!option) {
    return <></>;
  }
  return (
    <span className={styles.lawOption}>
      <span className={styles.check} aria-hidden="true">
        {option.key === selectedKey ? <Icon iconName="CheckMark" /> : null}
      </span>
      <span>{option.text}</span>
    </span>
  );
}
