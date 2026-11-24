import { Dialog } from '@headlessui/react';
import { ArrowLeftIcon, ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Form, Formik } from 'formik';
import Image from 'next/image';
import * as Yup from 'yup';

import { getRealLogo } from '@/utils';

import { TextInput } from '../inputs/TextInput';

const validationSchema = Yup.object({
  email: Yup.string()
    .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address')
    .required('Email is required')
    .max(254, 'Email is too long')
    .trim(),
});

export const EmailInput = ({
  onClose,
  onReturn,
  onSubmit,
}: {
  onClose: () => void;
  onReturn: () => void;
  onSubmit: (email: string) => void;
}) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  return (
    <div className="mt-3 text-center sm:mt-1.5 pt-4">
      <div className="flex justify-between items-center -mt-4 mb-6">
        <button
          type="button"
          className="p-2 text-primary bg-neutral rounded-full hover:bg-surface-hover"
          onClick={onReturn}
        >
          <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="flex flex-row gap-2 items-center">
          <Image
            height={0}
            width={0}
            src={getRealLogo('/email', isDarkMode)}
            alt="Email"
            className="w-8 h-8 rounded-full mr-2"
          />
          <Dialog.Title as="h3" className="text-md font-semibold">
            Email
          </Dialog.Title>
        </div>
        <button
          type="button"
          className="p-2 text-primary bg-neutral rounded-full hover:bg-surface-hover"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-col gap-4 w-2/3 mx-auto">
        <Formik
          initialValues={{ email: '' }}
          validationSchema={validationSchema}
          onSubmit={values => onSubmit(values.email)}
        >
          {({ isValid, dirty }) => (
            <Form className="space-y-4">
              <TextInput
                name="email"
                type="email"
                placeholder="your@email.com"
                className="w-full p-3 rounded-lg bg-surface-field"
              />

              <button
                type="submit"
                disabled={!isValid || !dirty}
                className="w-full p-3 rounded-lg bg-primary text-white disabled:opacity-50 transition"
              >
                Login with Email
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};
