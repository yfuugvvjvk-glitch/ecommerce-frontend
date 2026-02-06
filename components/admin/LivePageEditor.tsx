'use client';

import PageManager from './PageManager';

interface LivePageEditorProps {
  pageId: string;
  onClose: () => void;
}

export default function LivePageEditor({ pageId, onClose }: LivePageEditorProps) {
  return <PageManager pageId={pageId} onClose={onClose} />;
}