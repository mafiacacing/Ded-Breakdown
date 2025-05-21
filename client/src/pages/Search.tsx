import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { hybridSearch, semanticSearch } from "@/lib/openai";
import type { Document } from "@/types";

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"hybrid" | "semantic" | "keyword">("hybrid");
  const [isSearching, setIsSearching] = useState(false);
  const [useVectorSearch, setUseVectorSearch] = useState(true);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults(null);
    
    try {
      let results;
      
      if (searchMode === "semantic" || (searchMode === "hybrid" && useVectorSearch)) {
        if (searchMode === "hybrid") {
          results = await hybridSearch({ query: searchQuery });
        } else {
          results = await semanticSearch({ query: searchQuery });
        }
      } else {
        // Keyword search
        const response = await fetch(`/api/search/keyword?q=${encodeURIComponent(searchQuery)}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }
        
        results = await response.json();
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      // Show error message
    } finally {
      setIsSearching(false);
    }
  };

  const formatHighlightedResult = (text: string, highlights: [number, number][]) => {
    if (!highlights || !highlights.length) return text;
    
    let result = '';
    let lastIndex = 0;
    
    highlights.forEach(([start, end]) => {
      result += text.substring(lastIndex, start);
      result += `<mark class="bg-yellow-200 px-0.5 rounded">${text.substring(start, end)}</mark>`;
      lastIndex = end;
    });
    
    result += text.substring(lastIndex);
    return result;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="text-sm text-gray-600">Search across all your documents and analysis</p>
      </div>
      
      {/* Search form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search for documents, content, analyses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Searching...
                  </>
                ) : (
                  <>
                    <i className="ri-search-line mr-2"></i>
                    Search
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <Tabs 
                defaultValue="hybrid" 
                value={searchMode} 
                onValueChange={(value) => setSearchMode(value as "hybrid" | "semantic" | "keyword")}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
                  <TabsTrigger value="semantic">Semantic</TabsTrigger>
                  <TabsTrigger value="keyword">Keyword</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {searchMode !== "keyword" && (
                <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                  <Switch
                    id="vector-search"
                    checked={useVectorSearch}
                    onCheckedChange={setUseVectorSearch}
                  />
                  <label htmlFor="vector-search" className="text-sm text-gray-700">
                    Use AI-powered vector search
                  </label>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Search results */}
      {searchResults !== null && (
        <Card>
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-lg">
              {isSearching 
                ? "Searching..." 
                : searchResults.length > 0 
                  ? `Found ${searchResults.length} results` 
                  : "No results found"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <Skeleton className="h-5 w-64 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((result, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                    <h3 className="font-medium text-primary-700 mb-1">
                      {result.documentName || result.title}
                    </h3>
                    
                    <div 
                      className="text-sm text-gray-700 mb-2" 
                      dangerouslySetInnerHTML={{ 
                        __html: formatHighlightedResult(
                          result.excerpt || result.content.substring(0, 200) + '...', 
                          result.highlights || []
                        ) 
                      }} 
                    />
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="flex items-center">
                        <i className={`${
                          result.documentType?.includes('pdf') 
                            ? 'ri-file-pdf-line text-red-500' 
                            : result.documentType?.includes('image') 
                            ? 'ri-image-line text-green-500' 
                            : 'ri-file-line text-blue-500'
                        } mr-1`}></i>
                        {result.documentType || 'Document'}
                      </span>
                      {result.matchScore && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Relevance: {Math.round(result.matchScore * 100)}%</span>
                        </>
                      )}
                      <span className="mx-2">•</span>
                      <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500">
                <i className="ri-search-line text-5xl mb-3 block"></i>
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm mt-1">
                  Try different keywords or search terms
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Search;
