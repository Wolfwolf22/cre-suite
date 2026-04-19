import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ToolHeader({ title, description, icon: Icon }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start gap-4 mb-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-1 p-2 rounded-lg hover:bg-cream-200 text-charcoal-700 transition-colors flex-shrink-0"
        title="Back to Dashboard"
      >
        <ArrowLeft size={18} />
      </button>
      <div>
        <div className="flex items-center gap-3 mb-1">
          {Icon && (
            <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon size={18} className="text-accent" />
            </div>
          )}
          <h1 className="font-serif text-3xl text-charcoal-900">{title}</h1>
        </div>
        {description && (
          <p className="text-charcoal-600 text-sm ml-12">{description}</p>
        )}
      </div>
    </div>
  );
}
