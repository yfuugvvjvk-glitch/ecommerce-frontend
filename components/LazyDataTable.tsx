'use client';

import dynamic from 'next/dynamic';
import TableSkeleton from './TableSkeleton';

const DataTable = dynamic(() => import('./DataTable'), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

export default DataTable;
