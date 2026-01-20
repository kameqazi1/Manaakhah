'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SearchThisAreaButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export function SearchThisAreaButton({ onClick, isLoading }: SearchThisAreaButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className="shadow-lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Searching...
        </>
      ) : (
        'Search this area'
      )}
    </Button>
  );
}
