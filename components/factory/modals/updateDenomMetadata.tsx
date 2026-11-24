import { cosmos, osmosis } from '@manifest-network/manifestjs';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { MsgSetDenomMetadata } from '@manifest-network/manifestjs/dist/codegen/osmosis/tokenfactory/v1beta1/tx';
import { Form, Formik } from 'formik';
import React from 'react';

import { SigningModalDialog } from '@/components';
import { TextArea, TextInput } from '@/components/react/inputs';
import env from '@/config/env';
import { useToast } from '@/contexts/toastContext';
import { TokenFormData } from '@/helpers/formReducer';
import { useFeeEstimation } from '@/hooks/useFeeEstimation';
import { useTx } from '@/hooks/useTx';
import { sanitizeImageUrl } from '@/lib/image-loader';
import { ExtendedMetadataSDKType, truncateString } from '@/utils';
import Yup from '@/utils/yupExtensions';

const TokenDetailsSchema = (_context: { subdenom: string }) =>
  Yup.object().shape({
    display: Yup.string().required('Display is required').noProfanity(),
    name: Yup.string().required('Name is required').noProfanity(),
    description: Yup.string()
      .required('Description is required')
      .min(10, 'Description must be at least 10 characters long')
      .noProfanity(),
    uri: Yup.string()
      .nullable()
      .test('is-valid-url', 'Must be a valid URL', function (value) {
        if (!value || value.trim() === '') return true; // Allow empty values
        return Yup.string().url().isValidSync(value);
      })
      .test('is-https', 'URL must use HTTPS protocol', function (value) {
        if (!value || value.trim() === '') return true; // Allow empty values
        return /^https:\/\//i.test(value);
      })
      .test('is-image', 'URL must point to an image file', function (value) {
        if (!value || value.trim() === '') return true; // Allow empty values
        return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*|#.*|$)/i.test(value);
      }),
  });

export default function UpdateDenomMetadataModal({
  isOpen,
  onClose,
  denom,
  address,
  admin,
  refetch,
  isGroup,
}: {
  isOpen: boolean;
  onClose: () => void;
  denom: ExtendedMetadataSDKType | null;
  address: string;
  admin: string;
  isGroup?: boolean;
  refetch: () => void;
}) {
  const baseDenom = denom?.base || '';
  const subdenom = denom?.base?.split('/').pop() || '';
  const symbol = subdenom.slice(1).toUpperCase();
  const formData = {
    name: denom?.name || '',
    symbol: denom?.display || '',
    description: denom?.description || '',
    display: denom?.display || '',
    base: baseDenom,
    denomUnits: denom?.denom_units || [
      { denom: baseDenom, exponent: 0, aliases: [symbol] },
      { denom: symbol, exponent: 6, aliases: [baseDenom] },
    ],
    uri: denom?.uri || '',
    uriHash: denom?.uri_hash || '',
    subdenom: subdenom || '',
    exponent: '6',
    label: baseDenom,
  };
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const { setDenomMetadata } = osmosis.tokenfactory.v1beta1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;

  const { setToastMessage } = useToast();
  const handleUpdate = async (values: TokenFormData, resetForm: () => void) => {
    const symbol = values.display.toUpperCase();
    try {
      const msg = isGroup
        ? submitProposal({
            groupPolicyAddress: admin,
            messages: [
              Any.fromPartial({
                typeUrl: MsgSetDenomMetadata.typeUrl,
                value: MsgSetDenomMetadata.encode({
                  sender: admin,
                  metadata: {
                    description: values.description || formData.description,
                    denomUnits: [
                      { denom: baseDenom, exponent: 0, aliases: [symbol] },
                      { denom: symbol, exponent: 6, aliases: [baseDenom] },
                    ],
                    base: baseDenom,
                    display: symbol,
                    name: values.name || formData.name,
                    symbol: symbol,
                    uri: values.uri || formData.uri,
                    uriHash: '',
                  },
                }).finish(),
              }),
            ],
            metadata: '',
            proposers: [address ?? ''],
            title: `Update ${symbol} metadata`,
            summary: `This proposal will update ${symbol}'s metadata.`,
            exec: 0,
          })
        : setDenomMetadata({
            sender: address,
            metadata: {
              description: values.description || formData.description,
              denomUnits: [
                { denom: baseDenom, exponent: 0, aliases: [symbol] },
                { denom: symbol, exponent: 6, aliases: [baseDenom] },
              ],
              base: baseDenom,
              display: symbol,
              name: values.name || formData.name,
              symbol: symbol,
              uri: values.uri || formData.uri,
              uriHash: '',
            },
          });

      await tx([msg], {
        fee: () => estimateFee(address, [msg]),
        onSuccess: () => {
          refetch();
          onClose();
        },
      });
    } catch (error) {
      console.error('Error during transaction setup:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <SigningModalDialog panelClassName="max-w-4xl" open={isOpen} onClose={onClose}>
      <Formik
        initialValues={formData}
        validationSchema={() => TokenDetailsSchema({ subdenom: subdenom })}
        onSubmit={async (values, { setSubmitting, setErrors, setFieldError }) => {
          try {
            // Validate the form data sync first
            await TokenDetailsSchema({ subdenom: subdenom }).validate(values, {
              abortEarly: false,
            });

            // Sanitize the image URL (remove if NSFW/problematic, but don't block submission)
            const sanitizedUri = sanitizeImageUrl(values.uri || '');
            if (values.uri && !sanitizedUri) {
              // Image was removed due to content filtering - show a toast warning
              setToastMessage({
                type: 'alert-warning',
                title: 'Image Removed',
                description:
                  'The image URL was removed due to inappropriate content. The token will be updated without an image.',
              });
            }

            // Call the original handleUpdate function with sanitized values
            const updatedValues = { ...values, uri: sanitizedUri };
            await handleUpdate(updatedValues, () => {});
          } catch (err) {
            if (err instanceof Yup.ValidationError) {
              const errors = err.inner.reduce((acc: Record<string, string>, error) => {
                acc[error.path as string] = error.message;
                return acc;
              }, {});
              setErrors(errors);
            } else {
              setFieldError('uri', 'An error occurred during validation');
            }
          } finally {
            setSubmitting(false);
          }
        }}
        validateOnChange={true}
        validateOnBlur={true}
        enableReinitialize={true}
      >
        {({ isValid, dirty, values, handleChange, handleSubmit, setFieldValue, isSubmitting }) => (
          <>
            <h3 className="text-xl font-semibold text-base-content mb-6">
              Update Metadata for{' '}
              <span className="font-light text-primary">
                {denom?.display?.startsWith('factory')
                  ? denom?.display?.split('/').pop()?.toUpperCase()
                  : truncateString(denom?.display ?? 'DENOM', 12)}
              </span>
            </h3>
            <div className="divider divider-horizontal -mt-4 -mb-0"></div>

            <Form className="py-4 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <TextInput
                  label="SUBDENOM"
                  name="subdenom"
                  value={baseDenom}
                  title={baseDenom}
                  disabled={true}
                  helperText="This field cannot be modified"
                />
                <TextInput
                  label="NAME"
                  name="name"
                  value={values.name}
                  placeholder={denom?.name}
                  onChange={handleChange}
                />
                <TextInput
                  label="LOGO URL"
                  name="uri"
                  value={values.uri}
                  placeholder={denom?.uri || 'Enter the logo URL (optional)'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    setFieldValue('uri', value);
                  }}
                  aria-label="Token logo URL"
                />
                <TextInput
                  label="TICKER"
                  name="display"
                  value={values.display}
                  placeholder={denom?.display}
                  onChange={handleChange}
                />
              </div>

              <TextArea
                label="DESCRIPTION"
                name="description"
                value={values.description}
                placeholder={denom?.description}
                onChange={handleChange}
              />
            </Form>
            <div className="mt-4 flex flex-row justify-center gap-2 w-full">
              <button
                type="button"
                className="btn w-[calc(50%-8px)] btn-md focus:outline-hidden bg-surface-inset"
                disabled={isSigning}
                onClick={() => onClose()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn w-1/2 btn-gradient text-white disabled:text-black"
                onClick={e => {
                  e.preventDefault();
                  handleSubmit();
                }}
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? <span className="loading loading-dots"></span> : 'Update'}
              </button>
            </div>
          </>
        )}
      </Formik>
    </SigningModalDialog>
  );
}
