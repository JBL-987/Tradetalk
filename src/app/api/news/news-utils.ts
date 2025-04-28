import { NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWSAPI_API_KEY;

export async function fetchNewsArticles(query?: string) {
  if (!NEWS_API_KEY) {
    return NextResponse.json(
      { error: "API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const requestBody = {
      query: {
        ...(query ? { $query: { keyword: query } } : {}),
        $filter: { forceMaxDataTimeWindow: "31" }
      },
      resultType: "articles",
      articlesSortBy: "date",
      includeArticleSocialScore: true,
      includeArticleConcepts: true,
      includeArticleCategories: true,
      includeArticleImage: true,
      apiKey: NEWS_API_KEY
    };

    const response = await fetch('https://eventregistry.org/api/v1/article/getArticles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}