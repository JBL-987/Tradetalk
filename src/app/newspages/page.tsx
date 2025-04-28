"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { Search, Newspaper, ArrowRight, Loader2, House } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Article {
  title: string;
  body: string;
  url: string;
  date: string;
  source: {
    title: string;
  };
  image: string;
}

export default function NewsSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [newsResults, setNewsResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError("Please enter a search term");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setNewsResults([]);
      
      const capitalizedSearchTerm = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
      const response = await fetch(`/api/news/search?query=${encodeURIComponent(capitalizedSearchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setNewsResults(data.articles?.results || []);
    } catch (err) {
      setError("Failed to fetch news. Please try again.");
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
       <div className="flex items-center space-x-3 border-b border-gray-500 w-full">
          <Link href="/dashboard" passHref>
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
          <House className="h-8 w-8 text-white" />
        </div>
          </Link>
        <h2 className="text-lg font-semibold">Home</h2>
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 rounded-full mb-6">
            <Newspaper className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            News Explorer
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Discover the latest news about financial assets from around the world with real-time updates
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length === 1) {
                    setSearchTerm(value.charAt(0).toUpperCase() + value.slice(1));
                  } else {
                    setSearchTerm(value);
                  }
                }}
                 onBlur={(e) => {
                 if (e.target.value) {
                  setSearchTerm(
                  e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)
                );
               }
               }}
              className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 pl-10 pr-4 py-2 text-sm md:text-base font-medium shadow-lg w-full focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              aria-label="Search news articles"
              />
            </div>
            <Button 
            type="submit" 
            disabled={loading}
            className="rounded-full bg-white text-black border border-transparent hover:bg-black hover:text-white hover:border-white text-sm md:text-base font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
           {loading ? (
           <div className="flex items-center space-x-2">
           <Loader2 className="h-4 w-4 animate-spin" />
           <span>Searching</span>
           </div>
           ) : (
            "Search"
            )}
           </Button>
          </form>

          {error && (
            <div className="mt-3 px-4 py-2 bg-red-900 text-red-100 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-white mb-4" />
            <p className="text-gray-300">Fetching the latest news...</p>
          </div>
        )}

        {newsResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Results for "{searchTerm}"
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsResults.map((article) => (
                <Card 
                  key={article.url} 
                  className="h-full flex flex-col bg-gray-900 border-gray-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  {article.image && (
                    <div className="w-full h-48 overflow-hidden rounded-t-lg">
                      <img 
                        src={article.image} 
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-lg font-semibold text-white">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="flex items-center text-gray-400">
                      <span className="inline-block bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded mr-2">
                        {article.source.title}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {formatDate(article.date)}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="line-clamp-3 text-gray-300">
                      {article.body}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Link href={article.url} target="_blank" rel="noopener noreferrer">
                      <Button 
                        variant="outline" 
                        className="group border-white text-white hover:bg-gray-800 hover:text-white"
                      >
                        Read more
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {newsResults.length === 0 && !loading && searchTerm && (
          <div className="text-center py-16 bg-gray-900 rounded-xl">
            <Newspaper className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-2xl font-medium text-white mb-2">
              No news articles found
            </h3>
            <p className="text-gray-400 mb-4">
              We couldn't find any results for "{searchTerm}"
            </p>
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
              className="text-black border-black hover:bg-white"
            >
              Try a different search
            </Button>
          </div>
        )}

        {!searchTerm && !loading && (
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl">
              <h3 className="text-2xl font-medium text-black mb-4">
                What kind of financial assets would you like to explore today?
              </h3>
              <p className="text-gray-400 mb-6">
                Search for information about financial assets
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Bitcoin', 'Ethereum', 'Solana', 'Microsoft', 'Nvidia', 'Apple', 'Google', 'Amazon'].map((topic) => (
                  <Button 
                    key={topic}
                    variant="outline"
                    onClick={() => setSearchTerm(topic)}
                    className="rounded-full text-sm text-white hover:text-black border-white hover:border-black hover:bg-white"
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}