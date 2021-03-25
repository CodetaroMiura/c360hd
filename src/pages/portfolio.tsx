import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';

import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import BaseLayout from '@layouts/base';
import { AccordionMenu, AccordionItem } from '@components/Accordion';
import React, { useEffect, useState, useRef } from 'react';

export default function Portfolio() {
  const router = useRouter();
  const { query } = router;
  const filterRef = useRef(query.filter ?? '');
  const [searchQuery, setSearchQuery] = useState('');

  const { t } = useTranslation('portfolio');

  useEffect(() => {
    const { filter } = query;
    if (filterRef.current === filter) {
      console.log(`Disable ${filter}`);
      return;
    }

    filterRef.current = filter;
    console.log(filter);
  }, [query]);

  function handleSearchChange(e: React.FormEvent<EventTarget>) {
    const { value } = e.target as HTMLInputElement;
    setSearchQuery(value);
  }

  function filterCategory(category: string) {
    return function () {
      router.push(`/portfolio?filter=${category}`, undefined, {
        shallow: true,
      });
    };
  }

  const categoryList = [
    'resto',
    'fashion',
    'convenience',
    'beauty',
    'art',
    'nursery',
    'recent',
    'other',
  ];

  const pageMeta = { title: t('pageTitle'), desc: t('pageDesc') };
  return (
    <BaseLayout pageMeta={pageMeta} theme='light'>
      <section className='hero'>
        <div>
          <p>{t('hero.subtitle')}</p>
          <h1>{t('hero.title')}</h1>
        </div>
        <Image
          src='/images/chair-img.png'
          alt='Man rocking on a chair'
          width={417}
          height={417}
        />
      </section>
      <article>
        <AccordionMenu>
          <AccordionItem
            item={{ value: 'filter', title: `${t('categories.title')}` }}
          >
            {categoryList.map((category) => (
              <button key={category} onClick={filterCategory(category)}>
                {t(`categories.${category}`)}
              </button>
            ))}
          </AccordionItem>
        </AccordionMenu>
        <input
          type='search'
          name='search'
          id='search'
          aria-label={`${t('search.placeholder')}`}
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <div className='gallery'>
          Gallery Items
          <button onClick={filterCategory('all')}>{t('buttonText')}</button>
        </div>
      </article>
    </BaseLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale = 'en' }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'site',
        'portfolio',
      ])),
    },
  };
};
