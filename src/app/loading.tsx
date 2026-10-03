import { PostelSpinner } from '@/components/ds';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <PostelSpinner message="Loading…" />
    </div>
  );
}
