import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsArticles } from '../news-utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  return fetchNewsArticles(query);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const query = body.query;

  if (!query) {
    return NextResponse.json(
      { error: "Query is required in request body" },
      { status: 400 }
    );
  }

  return fetchNewsArticles(query);
}