'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { WelcomeModal } from './WelcomeModal';

interface Props {
  communityName: string;
  welcomeMessage: string | null;
}

export function WelcomeHandler({ communityName, welcomeMessage }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    // Remove the query param without triggering a full reload
    const params = new URLSearchParams(searchParams.toString());
    params.delete('welcome');
    const newQuery = params.toString();
    const newPath = `${pathname}${newQuery ? `?${newQuery}` : ''}`;
    router.replace(newPath);
  };

  return (
    <WelcomeModal
      communityName={communityName}
      message={welcomeMessage}
      isOpen={isOpen}
      onClose={handleClose}
    />
  );
}
