import { textTranslated } from 'components/TextTranslated';
import Button from 'components/uiKit/buttons';
import Grid from 'components/uiKit/grid';
import Typography from 'components/uiKit/typography';
import { externalDialogCall } from 'context/dialog';
import {
  toastError,
  toastInfo,
  toastSuccess,
} from 'utils/functions/notifications';
import { api } from 'utils/services/api';
import { pageableProps } from 'utils/services/api/types';
import urls from 'utils/services/api/urls';

export interface WheelRuleDTO {
  id: number;
  type: string;
  name: string;
  enabled: boolean;
  brandId: number;
}

export const defaultRule: WheelRuleDTO = {
  id: 0,
  type: '',
  name: '',
  enabled: false,
  brandId: 0,
};

async function getAll(params?: pageableProps) {
  return api
    .get(urls.luckWheel.rule.getAll, { params })
    .then((res) => ({ content: res.data }));
}

interface submitFormOptions {
  successCallBack?: Function;
  errorCallBack?: Function;
  silent?: boolean;
}

function sanitizePayload(payload: WheelRuleDTO): WheelRuleDTO {
  console.log('payload: ', payload);

  function sanitizeId(id: number | string) {
    if (typeof id !== 'number') {
      return null;
    }
    if (id < 1) {
      return null;
    }
    return id;
  }

  return {
    ...payload,
    id: sanitizeId(payload?.id as any) as any,
  };
}

async function submitForm(payload: WheelRuleDTO, options?: submitFormOptions) {
  const formData = sanitizePayload(payload);
  const { errorCallBack, successCallBack, silent } = options || {};
  const action = formData?.id ? api.put : api.post;
  const url = formData?.id
    ? `${urls.luckWheel.rule.update}/${formData.id}`
    : urls.luckWheel.rule.create;
  await action(url, formData)
    .then((res) => {
      if (successCallBack) {
        successCallBack(res.data);
      }
      if (!silent) {
        const toastMessageKey = formData?.id
          ? 'generic-update-success'
          : 'generic-create-success';
        toastSuccess(
          textTranslated({ group: 'toast-notifications', key: toastMessageKey })
        );
      }
    })
    .catch((res) => {
      if (errorCallBack) {
        errorCallBack();
      }
      if (!silent) {
        toastError(
          textTranslated({
            group: 'toast-notifications',
            key: 'generic-error-message',
          })
        );
      }
    });
}
interface deleteItemI {
  id: number | string;
  successCallBack?: Function;
  errorCallBack?: Function;
}

async function handleConfirmDelete({
  id,
  successCallBack,
  errorCallBack,
}: deleteItemI) {
  await api
    .delete(`${urls.luckWheel.rule.delete}/${id}`)
    .then((res) => {
      if (successCallBack) {
        successCallBack(res);
      }
      toastInfo(
        textTranslated({
          group: 'toast-notifications',
          key: 'generic-delete-success',
        })
      );
      externalDialogCall.removeDialog('CONFIRM-DIALOG');
    })
    .catch((err: any) => {
      if (errorCallBack) {
        errorCallBack(err);
      }
      toastError(
        textTranslated({
          group: 'toast-notifications',
          key: 'generic-error-message',
        })
      );
      externalDialogCall.removeDialog('CONFIRM-DIALOG');
    });
}
async function deleteItem(props: deleteItemI) {
  externalDialogCall.displayDialog({
    dialogId: 'CONFIRM-DIALOG',
    content: (
      <Grid
        style={{
          width: '250px',
          maxWidth: '90vw',
          background: 'var(--root-bg)',
          borderRadius: '4pt',
        }}
        padding={['pt-5', 'pb-5', 'ps-3', 'pe-3']}
      >
        <Grid margin='mb-5' horizontalAlgin='center'>
          <Typography
            weight={700}
            size='xl'
            translateGroup='global'
            translateKey='are-you-sure?'
          />
        </Grid>
        <Grid horizontalAlgin='center' margin='mb-5'>
          <Typography
            translateGroup='global'
            translateKey='this-will-be-permanent'
            weight={600}
            style={{ textAlign: 'center' }}
          />
        </Grid>
        <Grid horizontalAlgin='space-between'>
          <Grid width={45}>
            <Button
              id='confirm-dialog-cancel-cta'
              type='button'
              block
              onClick={() => externalDialogCall.removeDialog('CONFIRM-DIALOG')}
              color='secondary'
            >
              <Typography
                translateGroup='global'
                translateKey='cancel'
                weight={600}
              />
            </Button>
          </Grid>
          <Grid width={45}>
            <Button
              id='confirm-dialog-confirm-cta'
              type='button'
              block
              onClick={() => handleConfirmDelete(props)}
              color='primary'
            >
              <Typography
                translateGroup='global'
                translateKey='continue'
                weight={600}
              />
            </Button>
          </Grid>
        </Grid>
      </Grid>
    ),
  });
}
export const LWRuleApi = {
  getAll,
  submitForm,
  defaultRule,
  deleteItem,
};
