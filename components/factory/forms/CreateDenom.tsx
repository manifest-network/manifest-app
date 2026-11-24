import { Form, Formik } from 'formik';
import Link from 'next/link';
import React from 'react';

import { TextInput } from '@/components/react/inputs';
import { TokenAction, TokenFormData } from '@/helpers/formReducer';
import { useSimulateDenomCreation } from '@/utils';
import Yup from '@/utils/yupExtensions';

export default function CreateDenom({
  nextStep,
  formData,
  dispatch,
}: Readonly<{
  nextStep: () => void;
  formData: TokenFormData;
  dispatch: React.Dispatch<TokenAction>;
}>) {
  const { simulateDenomCreation, isSimulating } = useSimulateDenomCreation();

  const DenomSchema = Yup.object().shape({
    subdenom: Yup.string()
      .required('Subdenom is required')
      .min(3, 'Subdenom must be at least 3 characters')
      .max(44, 'Subdenom must not exceed 44 characters')
      .noProfanity('Profanity is not allowed'),
  });

  async function validateDenomOnChain() {
    return await simulateDenomCreation(`u${formData.subdenom}`);
  }

  return (
    <section>
      <div className="lg:flex mx-auto w-full flex-col items-center justify-between">
        <Formik
          initialValues={formData}
          validationSchema={DenomSchema}
          onSubmit={async (values, { setSubmitting, setErrors }) => {
            try {
              // Validate the form data sync, first.
              await DenomSchema.validate(values);
              // Then send the request to the server, if the other things were okay.
              if (!(await validateDenomOnChain())) {
                setErrors({ subdenom: 'Simulation failed' });
              } else {
                nextStep();
              }
            } catch (err) {
              if (err instanceof Yup.ValidationError) {
                const errors = err.inner.reduce(
                  (acc: Record<string, string>, error) => ({
                    ...acc,
                    [error.path as string]: error.message,
                  }),
                  {}
                );
                setErrors(errors);
              } else {
                setErrors({ subdenom: 'An error occurred during simulation' });
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ setFieldValue, isValid, isSubmitting, isValidating, handleSubmit, setErrors }) => (
            <>
              <div className="flex items-center mx-auto w-full bg-surface-card p-6 sm:p-8 rounded-2xl shadow-lg">
                <div className="w-full">
                  <h1 className="mb-4 text-xl font-extrabold tracking-tight sm:mb-6 leading-tight border-b-[0.5px] border-line pb-4">
                    Create Denom
                  </h1>

                  <Form className="flex flex-col gap-3">
                    <TextInput
                      label="Token Sub Denom"
                      name="subdenom"
                      placeholder="token"
                      value={formData.subdenom}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        dispatch({
                          type: 'UPDATE_FIELD',
                          field: 'subdenom',
                          value: e.target.value,
                        });
                        setFieldValue('subdenom', e.target.value);
                        setErrors({});
                      }}
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

                    {/* Token Exponents Section */}
                    {/* <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Token Exponents</h3>
                      <p className="text-sm text-content-muted mb-4">
                        Use these exponents, subdenoms, and letter representations when creating new
                        tokens
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {tokenExponents.map(item => (
                          <div
                            key={item.exponent}
                            className="bg-surface-card hover:bg-surface-card-hover transition-colors rounded-lg shadow-sm p-4"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-semibold">
                                {item.exponent >= 0 ? '+' : ''}
                                {item.exponent}
                              </h3>
                              {item.letter && (
                                <span className="text-2xl font-bold text-primary">
                                  {item.letter}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-content-muted mb-1">
                              Subdenom: {item.subdenom}
                            </p>
                            <p className="text-xs text-content-muted">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div> */}
                  </Form>
                  {/* Buttons placed outside the form but inside Formik's render props */}
                </div>
              </div>
              <div className="flex gap-6  mt-6 mx-auto w-full">
                <Link href="/factory" legacyBehavior>
                  <button className="btn btn-neutral text-base-content py-2.5 sm:py-3.5 w-[calc(50%-12px)]">
                    <span className="hidden sm:inline">Back: Factory Page</span>
                    <span className="sm:hidden">Back</span>
                  </button>
                </Link>
                <button
                  className="w-[calc(50%-12px)] btn px-5 py-2.5 sm:py-3.5 btn-gradient text-white disabled:text-black"
                  onClick={() => handleSubmit()}
                  type="submit"
                  disabled={!isValid || isSubmitting || isValidating}
                >
                  Next: Token Metadata
                </button>
              </div>
            </>
          )}
        </Formik>
      </div>
    </section>
  );
}
