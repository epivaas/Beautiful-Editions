"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Photo {
  id: number;
  storage_path: string;
  sort_order: number;
  copyright_statement?: string;
}

interface Author {
  id: number;
  name: string;
}

interface Work {
  id: number;
  original_title: string;
  work_authors?: {
    author: Author;
  }[];
}

interface Publisher {
  id: number;
  name: string;
}

interface Series {
  id: number;
  name: string;
  publisher_id: number;
}

interface Edition {
  id: number;
  title: string;
  photos?: Photo[];
  work?: Work;
  publisher?: Publisher;
  series?: Series;
}

export default function Home() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEditions = async () => {
      try {
        const response = await fetch("/api/featured-editions");
        const data = await response.json();
        console.log("Fetched editions:", data);
        setEditions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch editions:", error);
        setEditions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEditions();
  }, []);

  const getMainPhoto = (photos?: Photo[]) => {
    if (!photos || photos.length === 0) return null;
    const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);
    return sorted[0];
  };

  const getAuthorName = (work?: Work) => {
    if (!work) return "Unknown Author";
    const author = work.work_authors?.[0]?.author;
    return author?.name || "Unknown Author";
  };

  const getEditionInfo = (edition: Edition) => {
    if (edition.series) {
      const seriesName = edition.series.name;
      // Try to find publisher from our fetched data
      const matchingPublisher = editions.find(e => e.publisher?.id === edition.series.publisher_id)?.publisher;
      if (matchingPublisher) {
        return `photo from the ${seriesName} (${matchingPublisher.name}) edition`;
      }
      return `photo from the ${seriesName} edition`;
    }
    if (edition.publisher) {
      return `photo from the ${edition.publisher.name} edition`;
    }
    return null;
  };

  return (
    <div style={{ paddingTop: '3rem', paddingBottom: '3rem', maxWidth: '1400px', margin: '0 auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontFamily: 'sans-serif', color: '#000000', fontWeight: '600' }}>Featured Works</h2>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}>
          <p style={{ color: '#000000', fontFamily: 'sans-serif' }}>Loading editions...</p>
        </div>
      ) : editions.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}>
          <p style={{ color: '#000000', fontFamily: 'sans-serif' }}>No editions available</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
          {editions.map((edition) => {
            const photo = getMainPhoto(edition.photos);
            return (
              <Link
                key={edition.id}
                href={`/edition/${edition.id}`}
                style={{
                  display: 'block',
                  textDecoration: 'none'
                }}
              >
                {/* Image Container */}
                <div style={{
                  backgroundColor: '#ffffff',
                  aspectRatio: '3/4',
                  overflow: 'hidden',
                  borderRadius: '0.75rem',
                  marginBottom: '1rem',
                  position: 'relative',
                  transition: 'transform 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  const overlay = e.currentTarget.querySelector('.copyright-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  const overlay = e.currentTarget.querySelector('.copyright-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '0';
                }}
                >
                  {photo ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img
                        src={`https://avqqokcmdcilngoqsegf.supabase.co/storage/v1/object/public/Book-photos/${photo.storage_path}`}
                        alt={edition.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {photo.copyright_statement && (
                        <div className="copyright-overlay" style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          padding: '0.75rem',
                          fontSize: '0.75rem',
                          fontFamily: 'sans-serif',
                          opacity: 0,
                          transition: 'opacity 0.3s',
                          lineHeight: '1.3',
                          pointerEvents: 'none'
                        }}>
                          {photo.copyright_statement}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f3ed',
                      color: '#c0b8a8',
                      fontFamily: 'sans-serif'
                    }}>
                      <span>No Image</span>
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{
                    fontFamily: 'sans-serif',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '0.1rem',
                    lineHeight: '1.4'
                  }}>
                    {edition.work?.original_title || edition.title}
                  </h3>
                  <p style={{
                    fontFamily: 'sans-serif',
                    fontSize: '0.85rem',
                    color: '#000000',
                    marginBottom: '0.3rem'
                  }}>
                    {getAuthorName(edition.work)}
                  </p>
                  {getEditionInfo(edition) && (
                    <p style={{
                      fontFamily: 'sans-serif',
                      fontSize: '0.75rem',
                      color: '#666666'
                    }}>
                      {getEditionInfo(edition)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
