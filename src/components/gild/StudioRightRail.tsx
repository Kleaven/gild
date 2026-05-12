import React from 'react';
import { GILD_FONTS } from './styles';

export function StudioRightRail({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  
  return (
    <aside style={{ 
      width: 320, 
      flexShrink: 0, 
      padding: '24px 20px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 24, 
      fontFamily: GILD_FONTS.sans,
      borderLeft: '1px solid oklch(0.96 0.005 250)',
      background: 'oklch(0.99 0.002 250)'
    }}>
      {children}
    </aside>
  );
}
