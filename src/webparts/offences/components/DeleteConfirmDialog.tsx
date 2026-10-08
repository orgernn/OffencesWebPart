import * as React from 'react';
import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { Dialog, DialogFooter, DialogType } from '@fluentui/react/lib/Dialog';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { IConviction } from '../models';
import { IServices, reportError } from '../services';
import { S } from '../strings';
import { dangerButtonStyles, defaultButtonStyles } from '../theme';
import styles from './OffenceForm.module.scss';

export interface IDeleteConfirmDialogProps {
  /** The offence to delete. Undefined = the dialog is closed. */
  item?: IConviction;
  services: IServices;
  onDismiss: () => void;
  /** Called after the item was permanently deleted. */
  onDeleted: () => void;
}

const CANCEL_BUTTON_ID = 'offences-delete-cancel';

/** Destructive confirmation. Cancel has the default focus. Confirm calls item.delete() (permanent). */
export const DeleteConfirmDialog: React.FC<IDeleteConfirmDialogProps> = ({ item, services, onDismiss, onDeleted }) => {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  // A fresh dialog for every item.
  React.useEffect(() => {
    setBusy(false);
    setError(undefined);
  }, [item]);

  const confirm = async (): Promise<void> => {
    if (!item) {
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await services.convictions.delete(item.id);
      setBusy(false);
      onDeleted();
    } catch (err) {
      setError(reportError(err, S.errDelete));
      setBusy(false);
    }
  };

  return (
    <Dialog
      hidden={!item}
      onDismiss={busy ? undefined : onDismiss}
      dialogContentProps={{
        type: DialogType.normal,
        title: S.deleteTitle,
        subText: S.deleteBody,
        closeButtonAriaLabel: S.cancel
      }}
      modalProps={{
        isBlocking: true,
        // Cancel gets the initial focus, so Enter / Space never deletes by accident.
        focusTrapZoneProps: { firstFocusableTarget: `#${CANCEL_BUTTON_ID}` }
      }}
    >
      {item && (
        <div className={styles.deleteDetails}>
          <span className={styles.deleteLabel}>{S.deleteLawLabel}:</span>
          <span className={styles.deleteValue}>{item.lawSource}</span>
          <span className={styles.deleteLabel}>{S.deleteSectionLabel}:</span>
          <span className={styles.deleteValue}>{item.section}</span>
        </div>
      )}
      {error && (
        <MessageBar className={styles.dialogError} messageBarType={MessageBarType.error} isMultiline role="alert">
          {error}
        </MessageBar>
      )}
      <DialogFooter>
        <PrimaryButton
          text={busy ? S.deleting : S.deleteConfirm}
          styles={dangerButtonStyles}
          disabled={busy}
          onClick={() => {
            confirm().catch((err) => console.error('[Offences] unexpected delete error', err));
          }}
        />
        <DefaultButton id={CANCEL_BUTTON_ID} text={S.cancel} styles={defaultButtonStyles} disabled={busy} onClick={onDismiss} />
      </DialogFooter>
    </Dialog>
  );
};
