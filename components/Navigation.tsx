"use client";

import Link from "next/link";
import SearchBox from "./SearchBox";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <nav className="sticky top-0 z-50">
      {/* Header with title - Black background */}
      <div style={{ backgroundColor: '#000000', paddingTop: isHomePage ? '3rem' : '1rem', paddingBottom: isHomePage ? '2rem' : '1rem' }}>
        <div className="mx-auto px-4 max-w-7xl">
          <Link href="/" className="block text-center no-underline">
            <h1 style={{ fontSize: isHomePage ? '4.5rem' : '2.25rem', color: 'white', fontFamily: 'sans-serif', fontWeight: '700', letterSpacing: '0.02em', marginBottom: 0 }}>
              Beautiful Editions
            </h1>
          </Link>
        </div>
      </div>

      {/* Search Box */}
      <div style={{ backgroundColor: '#000000', paddingTop: isHomePage ? '1rem' : '0.5rem', paddingBottom: isHomePage ? '1rem' : '0.5rem' }}>
        <div style={{ maxWidth: '28rem', margin: '0 auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <SearchBox />
        </div>
      </div>

      {/* Browse Cards Menu */}
      <div style={{ backgroundColor: '#000000', paddingTop: isHomePage ? '1.5rem' : '0.75rem', paddingBottom: isHomePage ? '4rem' : '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: isHomePage ? '6rem' : '1rem', flexWrap: 'wrap' }}>
          {/* Browse by Title */}
          <Link
            href="/titles"
            className="no-underline"
            style={{ display: 'block', padding: isHomePage ? '1.5rem' : '0.75rem', border: '1px solid #e0ddd0', borderRadius: '0.5rem', width: isHomePage ? '16rem' : '12rem', transition: 'background-color 0.3s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: '#8b6f47', marginTop: '0.25rem' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.253s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z" />
                </svg>
              </div>
              <div>
                <h3 style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Browse by Title</h3>
              </div>
            </div>
          </Link>

          {/* Browse by Author */}
          <Link
            href="/author"
            className="no-underline"
            style={{ display: 'block', padding: isHomePage ? '1.5rem' : '0.75rem', border: '1px solid #e0ddd0', borderRadius: '0.5rem', width: isHomePage ? '16rem' : '12rem', transition: 'background-color 0.3s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: '#8b6f47', marginTop: '0.25rem' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Browse by Author</h3>
              </div>
            </div>
          </Link>

          {/* Browse Publishers and Series */}
          <Link
            href="/publishers-series"
            className="no-underline"
            style={{ display: 'block', padding: isHomePage ? '1.5rem' : '0.75rem', border: '1px solid #e0ddd0', borderRadius: '0.5rem', width: isHomePage ? '16rem' : '12rem', transition: 'background-color 0.3s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: '#8b6f47', marginTop: '0.25rem' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Publishers & Series</h3>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}

