import { fetchNewsArticles } from './news-utils';

export async function GET() {
  return fetchNewsArticles();
}