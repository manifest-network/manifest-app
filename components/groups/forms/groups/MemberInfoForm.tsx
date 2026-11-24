import { Field, FieldArray, FieldProps, Form, Formik, useFormikContext } from 'formik';
import React, { useState } from 'react';

import { PlusIcon, TrashIcon } from '@/components/icons';
import { TextInput } from '@/components/react';
import { AddressInput } from '@/components/react/inputs/AddressInput';
import { Action, FormData } from '@/helpers/formReducer';
import Yup from '@/utils/yupExtensions';

const MemberSchema = Yup.object().shape({
  address: Yup.string().manifestAddress().required('Required'),
  name: Yup.string().required('Required').noProfanity('Profanity is not allowed'),
});

const MemberInfoSchema = Yup.object().shape({
  members: Yup.array()
    .of(MemberSchema)
    .min(1, 'At least one member is required')
    .test('unique-address', 'Addresses must be unique', function (members) {
      if (!members) return true;
      const addresses = members.map(member => member.address);
      const uniqueAddresses = new Set(addresses);
      return uniqueAddresses.size === addresses.length;
    }),
});

function MemberInfoFormFields({
  dispatch,
}: Readonly<{
  dispatch: (action: Action) => void;
  activeMemberIndex: number | null;
  setActiveMemberIndex: React.Dispatch<React.SetStateAction<number | null>>;
  address: string;
}>) {
  const { values } = useFormikContext<{
    members: { address: string; name: string }[];
  }>();

  return (
    <Form className="flex flex-col gap-4">
      <div className="max-h-[55vh] overflow-y-auto px-1">
        <FieldArray name="members">
          {({ remove, push }) => (
            <>
              {values.members.map((_member, index) => (
                <div
                  key={index}
                  className="flex relative flex-row bg-base-300 p-4 gap-2 mb-4 rounded-lg items-end"
                >
                  {index > 0 && <div className="absolute -top-2 left-2 text-xs">#{index + 1}</div>}

                  <div className="grow relative">
                    <Field name={`members.${index}.address`}>
                      {({ field, meta }: FieldProps) => (
                        <div className="relative">
                          <AddressInput
                            showError={false}
                            label="Address"
                            {...field}
                            type="text"
                            placeholder="manifest1..."
                            className={`input input-bordered w-full ${
                              meta.touched && meta.error ? 'input-error' : ''
                            }`}
                            onChange={e => {
                              field.onChange(e);
                              dispatch({
                                type: 'UPDATE_MEMBER',
                                index,
                                field: 'address',
                                value: e.target.value,
                              });
                            }}
                          />
                          {meta.touched && meta.error && (
                            <div
                              className="tooltip tooltip-bottom tooltip-open tooltip-error bottom-0 absolute left-1/2 transform -translate-x-1/2 translate-y-full mt-1 z-50 text-white text-xs"
                              data-tip={meta.error}
                              role="alert"
                              aria-live="polite"
                            >
                              <div className="w-0 h-0"></div>
                            </div>
                          )}
                        </div>
                      )}
                    </Field>
                  </div>

                  <div className="grow relative">
                    <Field name={`members.${index}.name`}>
                      {({ field, meta }: FieldProps) => (
                        <div className="relative">
                          <TextInput
                            showError={false}
                            label="Name"
                            {...field}
                            type="text"
                            placeholder="Alice"
                            className={`input input-bordered w-full ${
                              meta.touched && meta.error ? 'input-error' : ''
                            }`}
                            onChange={e => {
                              field.onChange(e);
                              dispatch({
                                type: 'UPDATE_MEMBER',
                                index,
                                field: 'name',
                                value: e.target.value,
                              });
                            }}
                          />
                          {meta.touched && meta.error && (
                            <div
                              className="tooltip tooltip-bottom tooltip-open bottom-0 tooltip-error absolute left-1/2 transform -translate-x-1/2 translate-y-full mt-1 z-50 text-white text-xs"
                              data-tip={meta.error}
                            >
                              <div className="w-0 h-0"></div>
                            </div>
                          )}
                        </div>
                      )}
                    </Field>
                  </div>

                  {index > 0 && (
                    <button
                      type="button"
                      className="absolute top-3 right-5 btn btn-error btn-sm"
                      onClick={() => {
                        remove(index);
                        dispatch({ type: 'REMOVE_MEMBER', index });
                      }}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn btn-gradient w-full"
                onClick={() => {
                  push({ address: '', name: '' });
                  dispatch({
                    type: 'ADD_MEMBER',
                    member: { address: '', name: '' },
                  });
                }}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add member
              </button>
            </>
          )}
        </FieldArray>
      </div>
    </Form>
  );
}

export default function MemberInfoForm({
  formData,
  dispatch,
  nextStep,
  prevStep,
  address,
}: Readonly<{
  formData: FormData;
  dispatch: (action: Action) => void;
  nextStep: () => void;
  prevStep: () => void;
  address: string;
}>) {
  // Local states needed by the form fields
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | null>(null);

  return (
    <section className="">
      <Formik
        initialValues={{ members: formData.members }}
        validationSchema={MemberInfoSchema}
        onSubmit={() => {
          nextStep();
        }}
        validateOnMount={true}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {formikProps => {
          const { handleSubmit, isValid } = formikProps;
          return (
            <>
              <div className="lg:flex mx-auto">
                <div className="flex items-center mx-auto w-full bg-surface-card p-[24px] rounded-3xl">
                  <div className="w-full">
                    <h1 className="mb-4 text-xl font-extrabold tracking-tight sm:mb-6 leading-tight border-b-[0.5px] border-line pb-4">
                      Member Info
                    </h1>

                    <MemberInfoFormFields
                      dispatch={dispatch}
                      activeMemberIndex={activeMemberIndex}
                      setActiveMemberIndex={setActiveMemberIndex}
                      address={address}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 mt-6 mx-auto w-full">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-neutral text-base-content py-2.5 sm:py-3.5 w-[calc(50%-12px)]"
                >
                  Back: Group Details
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-[calc(50%-12px)] btn px-5 py-2.5 sm:py-3.5 btn-gradient text-white disabled:text-black"
                  disabled={!isValid}
                >
                  Next: Group Policy
                </button>
              </div>
            </>
          );
        }}
      </Formik>
    </section>
  );
}
