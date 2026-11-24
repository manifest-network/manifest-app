import { Form, Formik, useFormikContext } from 'formik';
import React, { useEffect } from 'react';

import { NumberInput } from '@/components/react/inputs';
import env from '@/config/env';
import { Action, FormData } from '@/helpers/formReducer';
import { secondsToHumanReadable } from '@/utils';
import Yup from '@/utils/yupExtensions';

const createGroupPolicySchema = (maxVotingThreshold: number) =>
  Yup.object().shape({
    votingPeriod: Yup.object()
      .shape({
        days: Yup.number().min(0).required('Required'),
        hours: Yup.number().min(0).required('Required'),
        minutes: Yup.number().min(0).required('Required'),
        seconds: Yup.number().min(0).required('Required'),
      })
      .test(
        'min-total-time',
        () => `Voting period must be at least ${secondsToHumanReadable(env.minimumVotingPeriod)}`,
        value => {
          const { days, hours, minutes, seconds } = value || {};
          const totalSeconds =
            (days || 0) * 86400 + (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
          return totalSeconds >= env.minimumVotingPeriod;
        }
      ),
    votingThreshold: Yup.number()
      .required('Required')
      .min(1)
      .test(
        'max-voting-threshold',
        () => `Voting threshold cannot exceed total member weight (${maxVotingThreshold})`,
        value => {
          if (maxVotingThreshold === Number.MAX_SAFE_INTEGER) return true;
          return value <= maxVotingThreshold;
        }
      ),
  });

export default function GroupPolicyForm({
  nextStep,
  prevStep,
  formData,
  dispatch,
}: Readonly<{
  formData: FormData;
  dispatch: React.Dispatch<Action>;
  nextStep: () => void;
  prevStep: () => void;
}>) {
  const totalMemberWeight = formData.members.length;
  const maxVotingThreshold = totalMemberWeight > 0 ? totalMemberWeight : Number.MAX_SAFE_INTEGER;

  return (
    <section>
      <Formik
        initialValues={{
          votingPeriod: {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
          },
          votingThreshold: formData.votingThreshold || '',
        }}
        validationSchema={createGroupPolicySchema(maxVotingThreshold)}
        onSubmit={() => {
          nextStep();
        }}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {formikProps => {
          const { handleSubmit, isValid, values } = formikProps;
          return (
            <>
              <div className="lg:flex mx-auto">
                <div className="flex items-center mx-auto w-full bg-surface-card p-[24px] rounded-3xl">
                  <div className="w-full">
                    <h1 className="mb-4 text-xl font-extrabold tracking-tight sm:mb-6 leading-tight border-b-[0.5px] text-content-muted border-line pb-4">
                      Group Policy
                    </h1>

                    <GroupPolicyFormFields dispatch={dispatch} prevStep={prevStep} />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 mt-6 mx-auto w-full">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-neutral text-base-content py-2.5 sm:py-3.5 w-[calc(50%-12px)]"
                >
                  Back: Group Members
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-[calc(50%-12px)] btn px-5 py-2.5 sm:py-3.5 btn-gradient text-white disabled:text-black"
                  disabled={
                    !isValid ||
                    (values.votingPeriod.days === 0 &&
                      values.votingPeriod.hours === 0 &&
                      values.votingPeriod.minutes === 0 &&
                      values.votingPeriod.seconds === 0)
                  }
                >
                  Next: Confirmation
                </button>
              </div>
            </>
          );
        }}
      </Formik>
    </section>
  );
}

interface GroupPolicyFormFieldsProps {
  dispatch: React.Dispatch<Action>;
  prevStep: () => void;
}

function GroupPolicyFormFields({ dispatch, prevStep }: Readonly<GroupPolicyFormFieldsProps>) {
  const { values, errors, isValid, setFieldValue } = useFormikContext<{
    votingPeriod: { days: number; hours: number; minutes: number; seconds: number };
    votingThreshold: number | string;
  }>();

  useEffect(() => {
    const { days, hours, minutes, seconds } = values.votingPeriod;
    const totalSeconds =
      (days || 0) * 86400 + (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);

    dispatch({
      type: 'UPDATE_FIELD',
      field: 'votingPeriod',
      value: {
        seconds: BigInt(totalSeconds),
        nanos: 0,
      },
    });
  }, [values.votingPeriod, dispatch]);

  useEffect(() => {
    if (values.votingThreshold !== '') {
      dispatch({
        type: 'UPDATE_FIELD',
        field: 'votingThreshold',
        value: +values.votingThreshold,
      });
    }
  }, [values.votingThreshold, dispatch]);

  return (
    <Form className="min-h-[330px] flex flex-col gap-4">
      <div>
        <label className="block text-sm mb-1 font-medium text-content-muted">Voting Period</label>

        <div className="grid grid-cols-4 gap-2">
          <NumberInput
            name="votingPeriod.days"
            placeholder="Days"
            label="Days"
            value={values.votingPeriod.days}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = Math.max(0, parseInt(e.target.value) || 0);
              setFieldValue('votingPeriod.days', val);
            }}
            min={0}
          />

          <NumberInput
            name="votingPeriod.hours"
            placeholder="Hours"
            label="Hours"
            value={values.votingPeriod.hours}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = Math.max(0, parseInt(e.target.value) || 0);
              setFieldValue('votingPeriod.hours', val);
            }}
            min={0}
          />

          <NumberInput
            name="votingPeriod.minutes"
            placeholder="Minutes"
            label="Minutes"
            value={values.votingPeriod.minutes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = Math.max(0, parseInt(e.target.value) || 0);
              setFieldValue('votingPeriod.minutes', val);
            }}
            min={0}
          />

          <NumberInput
            name="votingPeriod.seconds"
            placeholder="Seconds"
            label="Seconds"
            value={values.votingPeriod.seconds}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = Math.max(0, parseInt(e.target.value) || 0);
              setFieldValue('votingPeriod.seconds', val);
            }}
            min={0}
          />
        </div>

        {typeof errors.votingPeriod === 'string' && (
          <div className="text-error text-sm mt-1">{errors.votingPeriod}</div>
        )}
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-content-muted">
          Qualified Majority (Number of total required votes)
        </label>
        <NumberInput
          name="votingThreshold"
          placeholder="e.g., 1"
          value={values.votingThreshold}
          onChange={e => {
            const val = Math.max(1, parseInt(e.target.value) || 1);
            setFieldValue('votingThreshold', val);
          }}
          min={1}
        />
      </div>
    </Form>
  );
}
