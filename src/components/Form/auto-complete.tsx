import { Controller } from 'react-hook-form';
import usePlacesAutoComplete, {
  getGeocode,
  getZipCode,
} from 'use-places-autocomplete';
import Downshift from 'downshift';
import formStyles from './styles.module.scss';

export function AddressAutoComplete() {
  const {
    value,
    setValue,
    clearSuggestions,
    suggestions: { data },
  } = usePlacesAutoComplete({
    requestOptions: {
      componentRestrictions: {
        country: 'ca',
      },
    },
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

  async function handleSelect({ description }, onChange) {
    setValue(description, false);
    clearSuggestions();

    // Get latitude and longitude via utility functions
    const fullAddress = await getGeocode({ address: description })
      .then((results) => getZipCode(results[0], false))
      .then((zipCode) => {
        return `${description}, ${zipCode}`;
      })
      .catch((error) => {
        console.log('😱 Error: ', error);
        return '';
      });

    // Add the value to the react-hook-form store
    onChange(fullAddress);
  }

  return (
    <>
      <Controller
        name='address'
        render={({ field: { ref, ...rest } }) => (
          <Downshift
            initialInputValue={value}
            onInputValueChange={(inputValue) => debounceInput(inputValue)}
            itemToString={(item) => item?.description ?? ''}
            labelId='address-label'
            {...rest}
            onChange={(item) => handleSelect(item, rest.onChange)}
          >
            {({
              getInputProps,
              getItemProps,
              getLabelProps,
              getMenuProps,
              isOpen,
              highlightedIndex,
            }) => (
              <div className={`${formStyles.field} autoComplete`}>
                <label
                  {...getLabelProps({
                    htmlFor: 'address',
                    id: 'address-label',
                  })}
                >
                  Address
                </label>
                <input
                  {...getInputProps({ id: 'address' })}
                  placeholder='Enter an address'
                />
                <ul {...getMenuProps({ id: 'address-menu' })}>
                  {isOpen
                    ? data.map((item, index) => {
                        const {
                          place_id,
                          structured_formatting: { main_text, secondary_text },
                        } = item;

                        return (
                          <li
                            className={highlightedIndex == index && 'selected'}
                            {...getItemProps({ item, index, key: place_id })}
                          >
                            <strong>{main_text}</strong>{' '}
                            <small>{secondary_text}</small>
                          </li>
                        );
                      })
                    : null}
                </ul>
              </div>
            )}
          </Downshift>
        )}
      />
      <style jsx>{`
        // input:focus ~ ul {
        //   box-shadow: 0px 0px 8px 4px var(--focus-color);
        // }

        input ::placeholder {
          opacity: 0;
        }

        ul {
          border: 1px solid hsl(var(--border-color));
          border-top-color: transparent;
          border-radius: 0 0 0.5rem 0.5rem;
          margin-top: -1px;
        }

        li {
          padding-left: 1rem;
          padding-right: 1rem;
        }

        .selected {
          background-color: hsl(var(--theme-color-hg));
        }
      `}</style>
    </>
  );
}