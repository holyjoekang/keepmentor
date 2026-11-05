import type { Bundle } from '@/lib/schema';
export interface TabProps { b: Bundle; reload: () => Promise<void> }
