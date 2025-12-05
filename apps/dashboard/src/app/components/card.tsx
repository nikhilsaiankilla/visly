import React from 'react'
import { cn } from '../../utils/utils';

const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cn("rounded-2xl border border-slate-100 bg-white text-slate-950 shadow-sm", "", className)}>
        {children}
    </div>
);

export default Card