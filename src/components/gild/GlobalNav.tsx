'use client';

import React, { useState } from 'react';
import { Wordmark } from '@/components/gild';
import { GlobalSidebar } from './GlobalSidebar';
import { Menu } from 'lucide-react';

interface GlobalNavProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forwarded straight to GlobalSidebar
  user: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forwarded straight to GlobalSidebar
  communities: any;
}

export function GlobalNav({ user, communities }: GlobalNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = React.useCallback(() => setIsOpen(true), []);
  const handleClose = React.useCallback(() => setIsOpen(false), []);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleOpen}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111',
            transition: 'background 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'oklch(0.96 0.005 250)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Menu size={20} />
        </button>
        <div onClick={handleOpen} style={{ cursor: 'pointer' }}>
          <Wordmark size={20} />
        </div>
      </div>

      <GlobalSidebar 
        user={user} 
        communities={communities} 
        isOpen={isOpen} 
        onClose={handleClose} 
      />
    </>
  );
}
