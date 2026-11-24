import { Form, Formik } from 'formik';
import React from 'react';

import { TextArea, TextInput } from '@/components/react/inputs';
import { useToast } from '@/contexts/toastContext';
import { TokenAction, TokenFormData } from '@/helpers/formReducer';
import { sanitizeImageUrl } from '@/lib/image-loader';
import { useSimulateDenomCreation } from '@/utils';
import Yup from '@/utils/yupExtensions';

export default function TokenDetails({
  nextStep,
  prevStep,
  formData,
  dispatch,
  address,
}: Readonly<{
  nextStep: () => void;
  prevStep: () => void;
  formData: TokenFormData;
  dispatch: React.Dispatch<TokenAction>;
  address: string;
}>) {
  const { simulateDenomCreation, isSimulating } = useSimulateDenomCreation();
  const { setToastMessage } = useToast();

  const TokenDetailsSchema = Yup.object().shape({
    display: Yup.string()
      .required('Display is required')
      .min(3, 'Ticker must be at least 3 characters')
      .max(44, 'Ticker must not exceed 44 characters')
      .noProfanity(),
    description: Yup.string()
      .required('Description is required')
      .min(10, 'Description must be at least 10 characters long')
      .noProfanity(),
    name: Yup.string().required('Name is required').noProfanity(),
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
    subdenom: Yup.string()
      .required('Subdenom is required')
      .min(3, 'Subdenom must be at least 3 characters')
      .max(44, 'Subdenom must not exceed 44 characters')
      .noProfanity('Profanity is not allowed'),
  });

  const updateField = (field: keyof TokenFormData, value: TokenFormData[keyof TokenFormData]) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const effectiveAddress =
    formData.isGroup && formData.groupPolicyAddress ? formData.groupPolicyAddress : address;

  const fullDenom = `factory/${effectiveAddress}/u${formData.subdenom}`;

  // Function to derive subdenom from ticker
  const deriveSubdenom = (ticker: string): string => {
    return ticker.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Function to validate subdenom on-chain
  async function validateDenomOnChain(subdenom: string): Promise<boolean> {
    return await simulateDenomCreation(`u${subdenom}`);
  }

  // Automatically set denom units
  React.useEffect(() => {
    const denomUnits = [
      { denom: fullDenom, exponent: 0, aliases: [] },
      { denom: formData.display, exponent: 6, aliases: [] },
    ];
    updateField('denomUnits', denomUnits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subdenom, formData.display, address]);

  return (
    <section>
      <div className="lg:flex mx-auto w-full flex-col items-center justify-between">
        <Formik
          initialValues={formData}
          validationSchema={TokenDetailsSchema}
          enableReinitialize={true}
          onSubmit={async (values, { setSubmitting, setErrors, setFieldError }) => {
            try {
              // Validate the form data sync first
              await TokenDetailsSchema.validate(values, { abortEarly: false });

              // Then validate subdenom on-chain
              const isSubdenomAvailable = await validateDenomOnChain(values.subdenom);

              if (!isSubdenomAvailable) {
                setFieldError('subdenom', 'This token subdenom is not available');
                setSubmitting(false);
                return;
              }

              // Sanitize the image URL (remove if NSFW/problematic, but don't block submission)
              const sanitizedUri = sanitizeImageUrl(values.uri || '');
              if (values.uri && !sanitizedUri) {
                // Image was removed due to content filtering - show a toast warning
                setToastMessage({
                  type: 'alert-warning',
                  title: 'Image Removed',
                  description:
                    'The image URL was removed due to inappropriate content. The token will be created without an image.',
                });
              }

              // Update form data with sanitized URI
              updateField('uri', sanitizedUri);

              // All validations passed, proceed to next step
              nextStep();
            } catch (err) {
              if (err instanceof Yup.ValidationError) {
                const errors = err.inner.reduce((acc: Record<string, string>, error) => {
                  acc[error.path as string] = error.message;
                  return acc;
                }, {});
                setErrors(errors);
              } else {
                setFieldError('subdenom', 'An error occurred during validation');
              }
            } finally {
              setSubmitting(false);
            }
          }}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {({
            isValid,
            isSubmitting,
            handleChange,
            handleSubmit,
            setFieldValue,
            setFieldError,
            errors,
            touched,
            values,
          }) => (
            <>
              <div className="flex items-center mx-auto w-full bg-surface-card p-6 sm:p-8 rounded-2xl shadow-lg">
                <div className="w-full">
                  <h1 className="mb-4 text-xl font-extrabold tracking-tight sm:mb-6 leading-tight border-b-[0.5px] border-line pb-4">
                    Token Metadata
                    {formData.subdenom && (
                      <span className={'text-content-muted'}>
                        {' '}
                        for ${formData.subdenom.toUpperCase()}
                      </span>
                    )}
                  </h1>
                  <Form className="min-h-[330px] flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextInput
                        label="Name"
                        name="name"
                        value={values.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          updateField('name', value);
                          setFieldValue('name', value);
                        }}
                        aria-label="Token name"
                        placeholder={'Enter the token name, e.g., "My token"'}
                      />
                      <TextInput
                        label="Ticker"
                        name="display"
                        value={values.display}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          const derivedSubdenom = deriveSubdenom(value);

                          // Update both local state and Formik state
                          updateField('display', value);
                          updateField('symbol', value.toUpperCase());
                          updateField('subdenom', derivedSubdenom);

                          setFieldValue('display', value);
                          setFieldValue('subdenom', derivedSubdenom);

                          // Clear only subdenom error when ticker changes
                          if (errors.subdenom) {
                            setFieldError('subdenom', undefined);
                          }
                        }}
                        aria-label="Token ticker"
                        placeholder={'Enter the token ticker, e.g., "MTK"'}
                        rightElement={
                          isSimulating && (
                            <div className="flex items-center gap-2">
                              <span className="loading loading-spinner loading-sm" />
                              <span className="text-sm text-content-muted">
                                checking availability...
                              </span>
                            </div>
                          )
                        }
                      />
                    </div>

                    {/* Hidden subdenom field for validation - now properly integrated with Formik */}
                    <input
                      type="hidden"
                      name="subdenom"
                      value={values.subdenom}
                      onChange={handleChange}
                    />

                    <div className="grid grid-cols-1 gap-4">
                      <TextInput
                        label="Logo URL"
                        name="uri"
                        value={values.uri}
                        placeholder={'Enter the logo URL (optional)'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          updateField('uri', value);
                          setFieldValue('uri', value);
                        }}
                        aria-label="Token logo URL"
                      />
                    </div>
                    <TextArea
                      label="Description"
                      name="description"
                      value={values.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        const value = e.target.value;
                        updateField('description', value);
                        setFieldValue('description', value);
                      }}
                      aria-label="Token description"
                      placeholder={'Enter the token description'}
                    />
                  </Form>
                </div>
              </div>
              <div className="flex gap-6  mt-6 mx-auto w-full">
                <button
                  onClick={prevStep}
                  className="btn btn-neutral text-base-content py-2.5 sm:py-3.5 w-[calc(50%-12px)]"
                >
                  Back
                </button>
                <button
                  className="w-[calc(50%-12px)] btn px-5 py-2.5 sm:py-3.5 btn-gradient text-white disabled:text-black"
                  onClick={e => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  type="button"
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? 'Validating...' : 'Next: Confirmation'}
                </button>
              </div>
            </>
          )}
        </Formik>
      </div>
    </section>
  );
}
