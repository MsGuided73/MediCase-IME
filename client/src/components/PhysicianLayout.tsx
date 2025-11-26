import React from 'react';
import { PhysicianNavigation } from './PhysicianNavigation';

interface PhysicianLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PhysicianLayout: React.FC<PhysicianLayoutProps> = ({
  children,
  className
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar/Header */}
      <PhysicianNavigation />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Navigation Spacing */}
        <div className="lg:hidden h-16" />

        {/* Page Content */}
        <main className={className}>
          {children}
        </main>
      </div>
    </div>
  );
};
