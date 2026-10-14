// @id 01M4W0CMMN0000000000000001
// @related 01M4W0H00K0000000000000006, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
import React from 'react';
import { useInspector, type InspectorMeta } from '@/hooks/useInspector';

interface AiBadgeProps {
  name: string;
  file: string;
  module: string;
  desc: string;
  ulid?: string;
  className?: string;
  children?: React.ReactNode;
}

export function AiBadge({ name, file, module, desc, ulid, className = '', children }: AiBadgeProps) {
  const { inspectorMode, openInspector } = useInspector();
  const meta: InspectorMeta = { name, file, module, desc, ulid };

  return (
    <div className={`ai-inspector-wrap ${inspectorMode ? 'ai-inspector-ring' : ''} ${className}`}>
      {inspectorMode && (
        <div className="ai-badge-label" onClick={() => openInspector(meta)}>
          {name} {ulid ? `[${ulid.slice(-6)}]` : ''}
        </div>
      )}
      {inspectorMode && (
        <div className="ai-badge-hint" title="Bấm để xem thông tin component" onClick={() => openInspector(meta)}>
          ?
        </div>
      )}
      {children}
    </div>
  );
}

export default AiBadge;

