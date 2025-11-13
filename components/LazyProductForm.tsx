'use client';

import dynamic from 'next/dynamic';
import FormSkeleton from './FormSkeleton';

const ProductForm = dynamic(() => import('./ProductForm'), {
  loading: () => <FormSkeleton />,
  ssr: false,
});

export default ProductForm;
