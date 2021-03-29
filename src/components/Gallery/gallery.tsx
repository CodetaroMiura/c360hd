import Link from 'next/link';
import { useEffect, useReducer } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

import { InitialRows } from './gallery-row';
import { initalItems } from './gallery-items';
import { categoryReducer, initCategory } from './reducer';

export function Gallery() {
  const { t } = useTranslation('portfolio');
  const {
    query: { filter },
  } = useRouter();
  const [state, dispatch] = useReducer(
    categoryReducer,
    { search: '', filter, items: initalItems },
    initCategory
  );

  useEffect(() => {
    if (filter) {
      dispatch({ type: 'filter', filter: filter as string });
      return;
    }
    dispatch({ type: 'reset' });
  }, [filter]);

  const isIdle = state.filter == '';
  const isFiltered = state.filter !== '';
  const isNotFound = state.items.length === 0;

  return (
    <div className='gallery'>
      {isIdle && <InitialRows items={state.items} />}
      <Link href='/portfolio?filter=all'>
        <a>{t('buttonText')}</a>
      </Link>
    </div>
  );
}