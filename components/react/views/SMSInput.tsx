import { Dialog } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { ArrowLeftIcon, ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AU, CN, DE, FR, GB, IN, JP, US } from 'country-flag-icons/react/3x2';
import { Form, Formik } from 'formik';
import Image from 'next/image';
import { useState } from 'react';
import * as Yup from 'yup';

import { getRealLogo } from '@/utils/logos';

import { TextInput } from '../inputs/TextInput';

// Country codes data with flag components
const countryCodes = [
  {
    code: '+1',
    country: 'US',
    FlagComponent: US,
    name: 'United States/Canada',
    minLength: 10,
    maxLength: 10,
  },
  {
    code: '+44',
    country: 'GB',
    FlagComponent: GB,
    name: 'United Kingdom',
    minLength: 10,
    maxLength: 10,
  },
  { code: '+91', country: 'IN', FlagComponent: IN, name: 'India', minLength: 10, maxLength: 10 },
  { code: '+33', country: 'FR', FlagComponent: FR, name: 'France', minLength: 9, maxLength: 9 },
  { code: '+49', country: 'DE', FlagComponent: DE, name: 'Germany', minLength: 10, maxLength: 11 },
  { code: '+81', country: 'JP', FlagComponent: JP, name: 'Japan', minLength: 10, maxLength: 10 },
  { code: '+86', country: 'CN', FlagComponent: CN, name: 'China', minLength: 11, maxLength: 11 },
  { code: '+61', country: 'AU', FlagComponent: AU, name: 'Australia', minLength: 9, maxLength: 9 },
];

const validationSchema = Yup.object({
  phoneNumber: Yup.string()
    .required('Phone number is required')
    .matches(/^\d+$/, 'Phone number should only contain digits')
    .test('valid-length', 'Invalid phone number length for selected country', function (value) {
      if (!value) return false;
      const selectedCountry = countryCodes.find(c => c.code === this.parent.countryCode);
      if (!selectedCountry) return false;

      return value.length >= selectedCountry.minLength && value.length <= selectedCountry.maxLength;
    }),
});

export const SMSInput = ({
  onClose,
  onReturn,
  onSubmit,
}: {
  onClose: () => void;
  onReturn: () => void;
  onSubmit: (phone: string) => void;
}) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState('+1');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);
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
            src={getRealLogo('/sms', isDarkMode)}
            alt="SMS"
            className="w-8 h-8 rounded-full mr-2"
          />
          <Dialog.Title as="h3" className="text-md font-semibold">
            SMS
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
          initialValues={{ phoneNumber: '', countryCode: selectedCountryCode }}
          validationSchema={validationSchema}
          onSubmit={values => {
            const fullNumber = `${selectedCountryCode}-${values.phoneNumber}`;
            onSubmit(fullNumber);
          }}
          enableReinitialize
        >
          {({ isValid, dirty }) => (
            <Form className="space-y-4">
              <div className="w-full">
                <div className="relative">
                  <TextInput
                    name="phoneNumber"
                    type="tel"
                    placeholder="0123456789"
                    className="input input-md border border-line bg-surface-field w-full pl-24 text-base-content"
                    leftElement={
                      <div className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <div className="dropdown dropdown-bottom">
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen(true)}
                            className="flex items-center gap-1 text-sm text-content-muted"
                          >
                            {selectedCountry && (
                              <selectedCountry.FlagComponent className="w-4 h-3" />
                            )}
                            <span>{selectedCountryCode}</span>
                            <ChevronDownIcon className="h-4 w-4" />
                          </button>
                          {isDropdownOpen && (
                            <ul className="dropdown-content z-50 menu p-2 max-h-32 shadow-sm bg-base-300 rounded-lg mt-1 w-80 overflow-y-auto text-base-content">
                              {countryCodes.map(({ code, FlagComponent, country }) => (
                                <li key={code}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountryCode(code);
                                      setIsDropdownOpen(false);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <FlagComponent className="w-4 h-3" />
                                    <div className="flex flex-col">
                                      <span className="text-sm">{country}</span>
                                      <span className="text-xs text-content-muted">{code}</span>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="h-6 border-l border-line mx-2" />
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="text-sm text-content-muted">
                Enter your phone number without country code
              </div>

              <button
                type="submit"
                disabled={!isValid || !dirty}
                className="w-full p-3 rounded-lg bg-primary text-white disabled:opacity-50 transition"
              >
                Login with SMS
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};
