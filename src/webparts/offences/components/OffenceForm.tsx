import * as React from 'react';
import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { Panel, PanelType } from '@fluentui/react/lib/Panel';
import { TextField } from '@fluentui/react/lib/TextField';
import { LAWS } from '../config';
import { IConviction } from '../models';
import { IServices, reportError } from '../services';
import { S } from '../strings';
import { defaultButtonStyles, lawDropdownStyles, primaryButtonStyles } from '../theme';
import { renderCheckOption } from './LawOption';
import styles from './OffenceForm.module.scss';
import { SectionPicker } from './SectionPicker';

export interface IOffenceFormProps {
  isOpen: boolean;
  caseId: number;
  /** The offence being edited. Undefined = add a new one. */
  item?: IConviction;
  services: IServices;
  onDismiss: () => void;
  /** Called after a successful save: the parent closes the form and refreshes the list. */
  onSaved: () => void;
}

const lawOptions: IDropdownOption[] = LAWS.map((law) => ({ key: law.lawSource, text: law.lawSource }));

/**
 * Add / edit panel. The parent gives it a new `key` every time it is opened, so its state always
 * starts from `item` (or empty) and never leaks from the previous use.
 */
export const OffenceForm: React.FC<IOffenceFormProps> = ({ isOpen, caseId, item, services, onDismiss, onSaved }) => {
  const [law, setLaw] = React.useState(item ? item.lawSource : '');
  const [section, setSection] = React.useState(item ? item.section : '');
  const [details, setDetails] = React.useState(item ? item.details : '');
  const [saving, setSaving] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const lawIsListed = lawOptions.some((option) => option.key === law);

  const onLawChange = (_event: unknown, option?: IDropdownOption): void => {
    if (!option) {
      return;
    }
    const next = String(option.key);
    if (next !== law) {
      setLaw(next);
      setSection(''); // changing the law clears the chosen section
      setError(undefined);
    }
  };

  const save = async (): Promise<void> => {
    setSubmitted(true);
    if (law === '' || section === '') {
      setError(S.requiredLawAndSection);
      return;
    }

    setError(undefined);
    setSaving(true);
    try {
      const duplicate = await services.convictions.findDuplicate(caseId, law, section, item ? item.id : undefined);
      if (duplicate) {
        setError(S.duplicateOffence);
        setSaving(false);
        return;
      }

      const input = { lawSource: law, section, details };
      if (item) {
        await services.convictions.update(item.id, input);
      } else {
        await services.convictions.add(caseId, input);
      }
      setSaving(false);
      onSaved();
    } catch (err) {
      setError(reportError(err, S.errSave));
      setSaving(false);
    }
  };

  const dismiss = (): void => {
    if (!saving) {
      onDismiss();
    }
  };

  const renderFooter = (): JSX.Element => (
    <div className={styles.footer}>
      <PrimaryButton
        text={saving ? S.saving : S.save}
        styles={primaryButtonStyles}
        disabled={saving}
        onClick={() => {
          save().catch((err) => console.error('[Offences] unexpected save error', err));
        }}
      />
      <DefaultButton text={S.cancel} styles={defaultButtonStyles} disabled={saving} onClick={dismiss} />
    </div>
  );

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={dismiss}
      type={PanelType.custom}
      customWidth="480px"
      headerText={item ? S.editTitle : S.addTitle}
      closeButtonAriaLabel={S.closePanel}
      isLightDismiss={!saving}
      isFooterAtBottom
      onRenderFooterContent={renderFooter}
    >
      <div className={styles.form}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline role="alert">
            {error}
          </MessageBar>
        )}

        <Dropdown
          label={S.lawLabel}
          required
          placeholder={S.lawPlaceholder}
          options={lawOptions}
          selectedKey={lawIsListed ? law : null}
          onChange={onLawChange}
          onRenderOption={(option) => renderCheckOption(option, law)}
        styles={lawDropdownStyles}
          errorMessage={submitted && law === '' ? S.fieldRequired : undefined}
          disabled={saving}
        />

        <SectionPicker
          law={law}
          value={section}
          sectionsService={services.sections}
          onChange={(text) => {
            setSection(text);
            setError(undefined);
          }}
          errorMessage={submitted && law !== '' && section === '' ? S.fieldRequired : undefined}
        />

        <TextField
          label={S.detailsLabel}
          multiline
          rows={6}
          resizable={false}
          value={details}
          onChange={(_event, value) => setDetails(value || '')}
          disabled={saving}
        />
      </div>
    </Panel>
  );
};
