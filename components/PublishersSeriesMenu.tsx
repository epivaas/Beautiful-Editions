"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Publisher {
  id: number;
  name: string;
}

interface Series {
  id: number;
  name: string;
  publisher: {
    id: number;
    name: string;
  };
}

export default function PublishersSeriesMenu() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch publishers and series
        const response = await fetch("/api/publishers-series");
        if (response.ok) {
          const data = await response.json();
          setPublishers(data.publishers || []);
          setSeries(data.series || []);
        }
      } catch (error) {
        console.error("Error fetching publishers and series:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link
        href="/publishers-series"
        className="text-[#1a1a1a] hover:text-[#8b6f47] transition font-bold px-4 py-2 rounded hover:bg-[#fdfcf0] whitespace-nowrap"
      >
        Publishers and Series
      </Link>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-[#e0ddd0] rounded shadow-lg py-2 z-50">
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-2 text-[#6b6b6b] text-sm">Loading...</div>
            ) : (
              <>
                {/* Publishers Section */}
                {publishers.length > 0 && (
                  <>
                    {publishers.map((publisher) => (
                      <Link
                        key={publisher.id}
                        href={`/publisher/${publisher.id}`}
                        className="block px-4 py-2 hover:bg-[#fdfcf0] transition text-[#1a1a1a] hover:text-[#8b6f47]"
                        onClick={() => setIsOpen(false)}
                      >
                        {publisher.name}
                      </Link>
                    ))}
                    
                    {series.length > 0 && (
                      <div className="border-t border-[#e0ddd0] my-2"></div>
                    )}
                  </>
                )}

                {/* Series Section */}
                {series.length > 0 && (
                  <>
                    {series.map((serie) => (
                      <Link
                        key={serie.id}
                        href={`/series/${serie.id}`}
                        className="block px-4 py-2 hover:bg-[#fdfcf0] transition text-[#1a1a1a] hover:text-[#8b6f47]"
                        onClick={() => setIsOpen(false)}
                      >
                        {serie.name} {serie.publisher && `(${serie.publisher.name})`}
                      </Link>
                    ))}
                  </>
                )}

                {publishers.length === 0 && series.length === 0 && !isLoading && (
                  <div className="px-4 py-2 text-[#6b6b6b] text-sm">
                    No publishers or series found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
