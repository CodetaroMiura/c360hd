import React, { useEffect, useState, useRef } from 'react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  useForm,
  FormProvider,
  useFormContext,
  useWatch,
  Control,
  Controller,
  RegisterOptions,
} from 'react-hook-form';
import usePlacesAutoComplete, {
  getGeocode,
  getZipCode,
} from 'use-places-autocomplete';
import { useCombobox } from 'downshift';

import BaseLayout from '@layouts/base';
import { Button } from '@components/button';

// Programmatically add those

const CANADIAN_PROVINCES = ['AB', 'BC', 'MB', 'NS', 'ON', 'QC', 'YT'] as const;
type CanadianProvince = typeof CANADIAN_PROVINCES[number];
interface businessInfo {
  businessName: string;
  decisionMaker: string;
  streetNumber: string;
  streetName: string;
  province: CanadianProvince;
  postalCode: string;
  primaryPhone: string;
  mobilePhone: string;
  email: string;
}

interface productInfo {
  productName: 'classic' | 'special';
  date: string;
  time: string;
  salesRep: string;
  addInfo: string;
}

type FormInputs = businessInfo & productInfo;

export default function Checkout() {
  const [formStep, setFormStep] = useState(0);

  function onSubmit(data: any) {
    console.log(data);
  }

  const methods = useForm<FormInputs>({
    defaultValues: {
      businessName: '',
      decisionMaker: '',
      streetNumber: '',
      streetName: '',
      province: 'QC',
      postalCode: '',
      primaryPhone: '',
      mobilePhone: '',
      email: '',
      date: '',
      time: '',
      salesRep: '',
      addInfo: '',
    },
    mode: 'onBlur',
  });

  // Use the form state to validate the page's inputs

  const { control } = methods;
  return (
    <BaseLayout pageMeta={{ title: 'Checkout' }}>
      <Head>
        <script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`}
          key='maps-api'
        ></script>
      </Head>
      <div className='wrapper'>
        <Timeline step={formStep} />
        <FormProvider {...methods}>
          <form action='post'>
            {formStep == 0 && <ClientInfo />}
            {formStep == 1 && <ContactInfo />}
            {formStep == 2 && <OrderInfo />}
            {formStep == 3 && <ReviewInfo control={control} />}
            {formStep == 4 && <h1>Checkout</h1>}
          </form>
        </FormProvider>
        <div className='buttons'>
          {formStep > 0 && (
            <Button
              className='previous'
              onClick={() => setFormStep((s) => s - 1)}
            >
              Previous Step
            </Button>
          )}
          {formStep < 4 && (
            <Button className='next' onClick={() => setFormStep((s) => s + 1)}>
              Next Step
            </Button>
          )}
        </div>
      </div>
      <style jsx>{`
        form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .buttons {
          display: flex;
          justify-content: space-between;
        }

        .buttons > :global(.previous) {
          margin-right: auto;
        }

        .buttons > :global(.next) {
          margin-left: auto;
        }
      `}</style>
    </BaseLayout>
  );
}

function Timeline({ step }: { step: number }) {
  return (
    <>
      <div>
        <ol className='timeline'>
          <li data-complete={step > 0}>Business Information</li>
          <li data-complete={step > 1}>Order Information</li>
          <li data-complete={step > 2}>Review Order</li>
          <li data-complete={step > 3}>Checkout</li>
        </ol>
      </div>

      <style jsx>{`
        ol {
          display: flex;
        }

        li + li {
          margin-left: 2rem;
        }

        [data-complete='true'] {
          background-color: hsl(var(--theme-color-hg));
        }
      `}</style>
    </>
  );
}

/**
 * Client information such as name, address, and contact
 */
function ClientInfo() {
  return (
    <>
      <FormField name='businessName' label='Company Name' />
      <FormField name='decisionMaker' label='Decision Maker' />
      <AddressAutoComplete />
      {/* <FormField name='streetNumber' label='Street Number' />
      <FormField name='streetName' label='Street Name' />
      <FormField
        type='select'
        name='province'
        label='Province'
        defaultValue='QC'
      >
        {CANADIAN_PROVINCES.map((province) => (
          <option value={province} key={province}>
            {province}
          </option>
        ))}
      </FormField> */}
    </>
  );
}

function ContactInfo() {
  return (
    <>
      <FormField name='postalCode' label='Postal Code' />
      <FormField name='primaryPhone' label='Primary Phone' />
      <FormField name='mobilePhone' label='Mobile Phone' />
      <FormField name='email' label='E-mail' />
    </>
  );
}

/**
 * Form step for information related to the order
 */
function OrderInfo() {
  const {
    query: { product },
  } = useRouter();
  return (
    <>
      <FormField
        type='select'
        name='productName'
        label='Product Name'
        defaultValue={product as string}
      >
        <option value='classic'>Classic</option>
        <option value='special'>Special</option>
      </FormField>
      <FormField type='date' name='date' label='Date' />
      <FormField name='salesRep' label='Agent Name' />
      <FormField type='textarea' name='addInfo' label='Additional Info' />
    </>
  );
}

function AddressAutoComplete() {
  const {
    value,
    setValue,
    clearSuggestions,
    suggestions: { status, data },
  } = usePlacesAutoComplete({
    requestOptions: {
      componentRestrictions: {
        country: 'ca',
      },
    },
  });

  const {
    isOpen,
    getComboboxProps,
    getInputProps,
    getItemProps,
    getLabelProps,
    getMenuProps,
  } = useCombobox({
    items: data,
    inputId: 'address',
    labelId: 'address-label',
    onInputValueChange: ({ inputValue }) => debounceInput(inputValue),
    onSelectedItemChange: ({ selectedItem }) => handleSelect(selectedItem),
  });

  let scheduled: null | string = null;
  function debounceInput(inputValue: string) {
    if (!scheduled) {
      window.setTimeout(() => {
        setValue(scheduled);
        scheduled = null;
      }, 300);
    }
    scheduled = inputValue;
  }

  function handleSelect({ description }) {
    setValue(description, false);
    clearSuggestions();

    // Get latitude and longitude via utility functions
    getGeocode({ address: description })
      .then((results) => getZipCode(results[0], false))
      .then((zipCode) => {
        console.log('📍 Address: ', { description, zipCode });
      })
      .catch((error) => {
        console.log('😱 Error: ', error);
      });
  }

  function renderSuggestions() {
    return data.map((suggestion) => {
      const {
        place_id,
        structured_formatting: { main_text, secondary_text },
      } = suggestion;

      return (
        <li key={place_id} {...getItemProps({ item: suggestion })}>
          <strong>{main_text}</strong> <small>{secondary_text}</small>
        </li>
      );
    });
  }

  // return (
  //   <div className='field autocomplete'>
  //     <label htmlFor='address'>Address</label>
  //     <input
  //       id='address'
  //       value={value}
  //       onChange={(e) => setValue(e.target.value)}
  //     />
  //     {status === 'OK' && <ul>{renderSuggestions()}</ul>}
  //   </div>
  // );

  return (
    <div className='field'>
      <label {...getLabelProps()}>Address</label>
      <div {...getComboboxProps()}>
        <input {...getInputProps()} />
      </div>
      <ul {...getMenuProps()}>{isOpen && renderSuggestions()}</ul>
    </div>
  );
}

/**
 * Allow users to review their information before submitting
 */
function ReviewInfo({ control }: { control: Control<FormInputs> }) {
  const fields = useWatch({
    control,
  });

  return <pre>{JSON.stringify(fields, null, 2)}</pre>;
}

function FormField({
  type = 'text',
  name,
  label,
  defaultValue,
  validation = { required: true },
  className = '',
  children,
  ...otherProps
}: {
  type?: InputType;
  name: keyof FormInputs;
  label: string;
  validation?: RegisterOptions;
  defaultValue?: string | number;
  className?: string;
  children?: React.ReactNode;
}) {
  const { register } = useFormContext<FormInputs>();
  return (
    <>
      <div className='field'>
        <label htmlFor={name} className={`field-label ${className}`}>
          {label}
        </label>
        {type == 'select' ? (
          <select
            id={name}
            defaultValue={defaultValue}
            {...register(name, validation)}
            {...otherProps}
          >
            {children}
          </select>
        ) : type == 'textarea' ? (
          <textarea
            id={name}
            defaultValue={defaultValue}
            cols={20}
            rows={5}
            {...register(name, validation)}
            {...otherProps}
          />
        ) : (
          <input
            type={type}
            id={name}
            defaultValue={defaultValue}
            {...register(name, validation)}
            {...otherProps}
          />
        )}
      </div>
      <style jsx>{`
        label {
          display: block;
        }
      `}</style>
    </>
  );
}

type InputType = 'text' | 'date' | 'checkbox' | 'select' | 'textarea';

export const getStaticProps: GetStaticProps = async ({ locale = 'en' }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'site'])),
    },
  };
};
