"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/titles/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by author, title, or edition..."
          style={{
            flex: 1,
            padding: '1rem',
            fontSize: '1rem',
            border: '1px solid #e0ddd0',
            borderRadius: '0.75rem',
            backgroundColor: 'white',
            color: '#1a1a1a',
            fontFamily: 'sans-serif',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.outline = '2px solid #8b6f47'}
          onBlur={(e) => e.target.style.outline = 'none'}
        />
        <button
          type="submit"
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#8b6f47',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.3s',
            minWidth: '60px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6b5230'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b6f47'}
        >
          <svg style={{ width: '24px', height: '24px', stroke: 'white', strokeWidth: '2', fill: 'none' }} viewBox="0 0 24 24">
            <circle cx="10" cy="10" r="7" />
            <line x1="21" y1="21" x2="15" y2="15" />
          </svg>
        </button>
      </div>
    </form>
  );
}




