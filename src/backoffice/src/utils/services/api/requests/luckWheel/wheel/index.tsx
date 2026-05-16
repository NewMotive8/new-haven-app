import { textTranslated } from 'components/TextTranslated';
import { toastError, toastSuccess } from 'utils/functions/notifications';
import { api } from 'utils/services/api';
import { pageableProps } from 'utils/services/api/types';
import urls from 'utils/services/api/urls';

export interface WheelSegmentDTO {
  id: number | string;
  tier: number;
  order: number;
  colour: string;
  icon: string;
  probability: number;
  isRespin: boolean;
  isNextTier: boolean;
  payoutId: string;
  text: string;
  textStyles: string;
  iconStyles: string;
  startBgColor: string;
  endBgColor: string;
  bgImage: string;
  classPrefix: string;
  winMessageContent: string;
}

export interface DotDTO {
  id: number;
  color: string;
  shadow: string;
  size: number;
  classPrefix: string;
  render: string;
}

export interface TickerDTO {
  id: number;
  color: string;
  shadow: string;
  size: number;
  classPrefix: string;
  render: string;
}

export interface WheelDTO {
  id: number;
  internalName: string;
  internalDescription: string;
  externalName: string;
  externalId: string;
  enabled: boolean;
  brandId: number;
  startDate: string;
  endDate: string;
  isVisible: boolean;
  widgetImage: string;
  tierScale: string;
  borderColor: string;
  borderWidth: number;
  renderStripes: string;
  animationSpins: number;
  animationDuration: number;
  dot: DotDTO;
  ticker: TickerDTO;
  wheelSegments: WheelSegmentDTO[];
}

export const defaultWheelSegment: WheelSegmentDTO = {
  id: 0,
  order: 0,
  tier: 0,
  colour: '',
  icon: '',
  probability: 0,
  isRespin: false,
  isNextTier: false,
  payoutId: '',
  text: '✨',
  textStyles: '',
  iconStyles: '',
  startBgColor: '#FFFFFFFF',
  endBgColor: '#38004DFF',
  bgImage: '',
  classPrefix: '',
  winMessageContent: '',
};

export const defaultDot: DotDTO = {
  id: 0,
  color: '#FFFFFFFF',
  shadow: '#000000FF',
  size: 50,
  classPrefix: '',
  render: '[]',
};

export const defaultTicker: TickerDTO = {
  id: 0,
  color: '#FFFFFFFF',
  shadow: '#000000FF',
  size: 8,
  classPrefix: '',
  render: 'true',
};

export const defaultWheel: WheelDTO = {
  id: 0,
  internalName: '',
  internalDescription: '',
  externalName: '',
  externalId: '',
  enabled: false,
  brandId: 0,
  startDate: '',
  endDate: '',
  isVisible: false,
  widgetImage: '',
  tierScale: '[0.9, 0.65, 0.4, 0.2]',
  renderStripes: '[]',
  borderColor: '#FFFFFFFF',
  borderWidth: 4,
  animationSpins: 8,
  animationDuration: 8,
  dot: defaultDot,
  ticker: defaultTicker,
  wheelSegments: [],
};

async function getWheels(params?: pageableProps) {
  return api
    .get(urls.luckWheel.wheel.getAll, { params })
    .then((res) => ({ content: res.data }));
}

interface submitFormOptions {
  successCallBack?: Function;
  errorCallBack?: Function;
  silent?: boolean;
}

function sanitizePayload(payload: WheelDTO): WheelDTO {
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

  const newDot = { ...payload.dot, id: sanitizeId(payload?.dot?.id) as any };
  const newTicker = {
    ...payload.ticker,
    id: sanitizeId(payload?.ticker?.id) as any,
  };
  const newWheelSegments = payload.wheelSegments.map((segment: any) => ({
    ...segment,
    id: sanitizeId(segment.id),
  }));

  return {
    ...payload,
    id: sanitizeId(payload?.id as any) as any,
    dot: newDot,
    ticker: newTicker,
    wheelSegments: newWheelSegments,
  };
}

async function submitWheelForm(payload: WheelDTO, options?: submitFormOptions) {
  const formData = sanitizePayload(payload);
  const { errorCallBack, successCallBack, silent } = options || {};
  const action = formData?.id ? api.put : api.post;
  const url = formData?.id
    ? `${urls.luckWheel.wheel.update}/${formData.id}`
    : urls.luckWheel.wheel.create;
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

export const luckWheelApi = {
  getWheels,
  submitWheelForm,
  defaultWheel,
  defaultWheelSegment,
  defaultDot,
  defaultTicker,
};
