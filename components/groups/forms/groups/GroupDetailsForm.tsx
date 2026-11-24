import { FieldArray, Form, Formik, useFormikContext } from 'formik';
import Link from 'next/link';
import React from 'react';

import { PlusIcon, TrashIcon } from '@/components/icons';
import { TextArea, TextInput } from '@/components/react/inputs';
import { AddressInput } from '@/components/react/inputs/AddressInput';
import { Action, FormData } from '@/helpers/formReducer';
import { MAXIMUM_GROUP_DETAILS_LENGTH } from '@/schemas/group';
import { isValidManifestAddress } from '@/utils/string';
import Yup from '@/utils/yupExtensions';

const GroupSchema = Yup.object().shape({
  title: Yup.string()
    .required('Title is required')
    .max(50, 'Title must not exceed 50 characters')
    .noProfanity(),
  authors: Yup.lazy(val =>
    Array.isArray(val)
      ? Yup.array()
          .of(
            Yup.string().test(
              'author-validation',
              'Invalid author name or address',
              function (value) {
                if (value?.startsWith('manifest')) {
                  return isValidManifestAddress(value);
                }
                return Yup.string()
                  .max(50, 'Author name must not exceed 50 characters')
                  .noProfanity('Profanity is not allowed')
                  .isValidSync(value);
              }
            )
          )
          .min(1, 'At least one author is required')
      : Yup.string()
          .test('single-author-validation', 'Invalid author name or address', function (value) {
            if (value?.startsWith('manifest')) {
              return isValidManifestAddress(value);
            }
            return Yup.string()
              .max(50, 'Author name must not exceed 50 characters')
              .noProfanity('Profanity is not allowed')
              .isValidSync(value);
          })
          .min(1, 'At least one author is required')
  ),
  description: Yup.string()
    .required('Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(
      MAXIMUM_GROUP_DETAILS_LENGTH,
      `Description must not exceed ${MAXIMUM_GROUP_DETAILS_LENGTH} characters`
    )
    .noProfanity('Profanity is not allowed'),
});

function GroupDetailsFormFields({
  dispatch,
  address,
  activeAuthorIndex,
  setActiveAuthorIndex,
}: Readonly<{
  dispatch: React.Dispatch<Action>;
  address: string;
  activeAuthorIndex: number | null;
  setActiveAuthorIndex: React.Dispatch<React.SetStateAction<number | null>>;
}>) {
  const { values, handleChange, setFieldValue } = useFormikContext<FormData>();
  const authors = Array.isArray(values.authors) ? values.authors : [values.authors];

  const updateField = (field: keyof FormData, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  return (
    <Form className="min-h-[330px] flex flex-col gap-4">
      <TextInput
        label="Group Title"
        name="title"
        placeholder="Title"
        value={values.title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          updateField('title', e.target.value);
          handleChange(e);
        }}
      />

      <TextArea
        label="Description"
        name="description"
        placeholder="Long Bio"
        value={values.description}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          updateField('description', e.target.value);
          handleChange(e);
        }}
      />

      <div className="form-control w-full">
        <div className="max-h-[30vh] overflow-y-auto px-1">
          <FieldArray
            name={'authors'}
            render={arrayHelpers => {
              return (
                <>
                  {authors.map((author, index) => (
                    <div key={index} className="flex mb-2 items-center">
                      <AddressInput
                        label={index == 0 ? 'Author name or address' : undefined}
                        name={`authors[${index}]`}
                        placeholder="Author name or address"
                        value={author}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newAuthors = [...values.authors];
                          newAuthors[index] = e.target.value;
                          setFieldValue('authors', newAuthors);
                          updateField('authors', newAuthors);
                        }}
                        className="grow"
                        rightElement={
                          values.authors.length > 1 &&
                          index !== 0 && (
                            <button
                              type="button"
                              onClick={() => arrayHelpers.remove(index)}
                              className="btn btn-error btn-sm"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )
                        }
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => arrayHelpers.push('')}
                    className="btn btn-gradient text-white w-full mt-2"
                  >
                    <PlusIcon className="mr-2" /> Add Author
                  </button>
                </>
              );
            }}
          />
        </div>
      </div>
    </Form>
  );
}

export default function GroupDetails({
  nextStep,
  formData,
  dispatch,
  address,
}: Readonly<{
  nextStep: () => void;
  formData: FormData;
  dispatch: React.Dispatch<Action>;
  address: string;
}>) {
  const [activeAuthorIndex, setActiveAuthorIndex] = React.useState<number | null>(null);

  const authors = Array.isArray(formData.authors) ? formData.authors : [formData.authors];

  return (
    <section>
      <Formik
        initialValues={{
          ...formData,
          authors: authors.length > 0 ? authors : [''],
        }}
        validationSchema={GroupSchema}
        onSubmit={() => {
          nextStep();
        }}
      >
        {formikProps => {
          const { handleSubmit, isValid, values } = formikProps;
          const authors = Array.isArray(values.authors) ? values.authors : [values.authors];
          return (
            <>
              <div className="lg:flex mx-auto">
                <div className="flex items-center mx-auto w-full bg-surface-card p-[24px] rounded-3xl">
                  <div className="w-full">
                    <h1 className="mb-4 text-xl font-extrabold tracking-tight sm:mb-6 leading-tight border-b-[0.5px] border-line pb-4">
                      Group details
                    </h1>

                    <GroupDetailsFormFields
                      dispatch={dispatch}
                      address={address}
                      activeAuthorIndex={activeAuthorIndex}
                      setActiveAuthorIndex={setActiveAuthorIndex}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 mt-6 mx-auto w-full">
                <Link href="/groups" legacyBehavior>
                  <button
                    type="button"
                    className="btn btn-neutral text-base-content py-2.5 sm:py-3.5 w-[calc(50%-12px)]"
                  >
                    <span className="hidden sm:inline">Back: Groups Page</span>
                    <span className="sm:hidden">Back: Groups</span>
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-[calc(50%-12px)] btn px-5 py-2.5 sm:py-3.5 btn-gradient text-white disabled:text-black"
                  disabled={
                    !isValid ||
                    !authors ||
                    !authors.length ||
                    authors.some(author => author.trim() === '')
                  }
                >
                  Next: Group Members
                </button>
              </div>
            </>
          );
        }}
      </Formik>
    </section>
  );
}
