import { absoluteUrl, repairText } from './format';

const STRAPI_URL = (import.meta.env.STRAPI_URL || 'https://strapi.unovative.com').replace(/\/$/, '');
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80';

export interface MediaFile {
  url: string;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
}

export interface ArticleCard {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  createdAt: string;
  publishedAt: string;
  updatedAt: string;
  image: string;
  imageSrcSet: string;
  imageAlt: string;
}

export type ArticleBlock =
  | { id: number; type: 'rich-text'; body: string }
  | { id: number; type: 'media'; file: MediaFile | null }
  | { id: number; type: 'quote'; body: string; title: string | null }
  | { id: number; type: 'slider'; files: MediaFile[] };

export interface Article extends ArticleCard {
  authorName: string | null;
  authorEmail: string | null;
  cover: string | null;
  blocks: ArticleBlock[];
}

export interface CategoryOption {
  slug: string;
  name: string;
}

type StrapiMedia = {
  url?: string | null;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: Record<string, { url?: string; width?: number; height?: number } | undefined>;
};

type RawBlock = {
  id?: number;
  __component?: string;
  body?: string | null;
  title?: string | null;
  file?: StrapiMedia | StrapiMedia[] | null;
  files?: StrapiMedia | StrapiMedia[] | null;
};

type RawArticle = {
  id: number;
  title?: string | null;
  description?: string | null;
  slug?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  cover?: StrapiMedia | null;
  category?: { name?: string | null; slug?: string | null } | null;
  author?: { name?: string | null; email?: string | null } | { name?: string | null; email?: string | null }[] | null;
  blocks?: RawBlock[] | null;
};

type Cache = {
  articles?: Promise<Article[]>;
};

const cache: Cache = ((globalThis as unknown as { __podArticles?: Cache }).__podArticles ??= {});

function mediaUrl(path: string | null | undefined): string | null {
  return absoluteUrl(STRAPI_URL, path);
}

function asMedia(value: StrapiMedia | StrapiMedia[] | null | undefined): StrapiMedia | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function asMediaList(value: StrapiMedia | StrapiMedia[] | null | undefined): StrapiMedia[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pickImage(media: StrapiMedia | null | undefined, preference: string[]): string | null {
  if (!media) return null;
  for (const key of preference) {
    const url = mediaUrl(media.formats?.[key]?.url);
    if (url) return url;
  }
  return mediaUrl(media.url);
}

function srcSet(media: StrapiMedia | null | undefined): string {
  if (!media?.formats) return '';
  const parts: string[] = [];
  for (const key of ['thumbnail', 'small', 'medium', 'large']) {
    const format = media.formats[key];
    const url = mediaUrl(format?.url);
    if (url && format?.width) parts.push(`${url} ${format.width}w`);
  }
  return parts.join(', ');
}

function toFile(media: StrapiMedia | null, fallbackAlt: string): MediaFile | null {
  const url = pickImage(media, ['large', 'medium', 'small']);
  if (!url || !media) return null;
  return {
    url,
    alt: repairText(media.alternativeText) || fallbackAlt,
    caption: repairText(media.caption) || null,
    width: media.width ?? null,
    height: media.height ?? null,
  };
}

function toBlock(block: RawBlock, title: string): ArticleBlock | null {
  const id = block.id ?? 0;
  switch (block.__component) {
    case 'shared.rich-text': {
      const body = repairText(block.body);
      return body.trim() ? { id, type: 'rich-text', body } : null;
    }
    case 'shared.quote': {
      const body = repairText(block.body);
      return body.trim() ? { id, type: 'quote', body, title: repairText(block.title) || null } : null;
    }
    case 'shared.media':
      return { id, type: 'media', file: toFile(asMedia(block.file), title) };
    case 'shared.slider':
      return {
        id,
        type: 'slider',
        files: asMediaList(block.files ?? block.file)
          .map((file) => toFile(file, title))
          .filter((file): file is MediaFile => Boolean(file)),
      };
    default:
      return null;
  }
}

function label(name: string): string {
  return name.replace(/\p{L}+/gu, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function toArticle(raw: RawArticle): Article | null {
  const slug = raw.slug?.trim();
  if (!slug) return null;
  const title = repairText(raw.title) || 'Untitled';
  const author = Array.isArray(raw.author) ? raw.author[0] : raw.author;
  const cover = pickImage(raw.cover, ['large', 'medium', 'small']);
  return {
    id: raw.id,
    slug,
    title,
    description: repairText(raw.description),
    category: label(repairText(raw.category?.name) || 'Uncategorized'),
    categorySlug: raw.category?.slug?.trim() || 'uncategorized',
    createdAt: raw.createdAt || raw.publishedAt || '',
    publishedAt: raw.publishedAt || raw.createdAt || '',
    updatedAt: raw.updatedAt || raw.publishedAt || raw.createdAt || '',
    image: pickImage(raw.cover, ['medium', 'small', 'large']) || FALLBACK_IMAGE,
    imageSrcSet: srcSet(raw.cover),
    imageAlt: repairText(raw.cover?.alternativeText) || title,
    authorName: repairText(author?.name) || null,
    authorEmail: author?.email?.trim() || null,
    cover,
    blocks: (raw.blocks ?? []).map((block) => toBlock(block, title)).filter((block): block is ArticleBlock => Boolean(block)),
  };
}

async function fetchPage(page: number): Promise<{ articles: Article[]; pageCount: number }> {
  const params = new URLSearchParams({
    'pagination[page]': String(page),
    'pagination[pageSize]': '100',
    'populate[cover]': 'true',
    'populate[category]': 'true',
    'populate[author]': 'true',
    'populate[blocks][populate]': '*',
  });
  const response = await fetch(`${STRAPI_URL}/api/articles?${params}`);
  if (!response.ok) {
    throw new Error(`Strapi request failed (${response.status}) for ${STRAPI_URL}/api/articles`);
  }
  const payload = (await response.json()) as {
    data?: RawArticle[];
    meta?: { pagination?: { pageCount?: number } };
  };
  return {
    articles: (payload.data ?? []).map(toArticle).filter((article): article is Article => Boolean(article)),
    pageCount: payload.meta?.pagination?.pageCount ?? 1,
  };
}

async function loadArticles(): Promise<Article[]> {
  const first = await fetchPage(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.pageCount - 1) }, (_, index) => fetchPage(index + 2)),
  );
  const merged = [first, ...rest].flatMap((page) => page.articles);
  const seen = new Set<string>();
  const unique: Article[] = [];
  for (const article of [...merged].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))) {
    if (seen.has(article.slug)) continue;
    seen.add(article.slug);
    unique.push(article);
  }
  const mediaBlocks = unique.reduce(
    (count, article) => count + article.blocks.filter((block) => block.type === 'media' && block.file).length,
    0,
  );
  console.log(`Loaded ${unique.length} articles and ${mediaBlocks} media blocks from ${STRAPI_URL}`);
  return unique;
}

export function getArticles(): Promise<Article[]> {
  cache.articles ??= loadArticles();
  return cache.articles;
}

export const PAGE_SIZE = 9;

export function byCreated(articles: Article[], direction: 'asc' | 'desc' = 'desc'): Article[] {
  return [...articles].sort((a, b) => {
    const delta = +new Date(a.createdAt) - +new Date(b.createdAt);
    return direction === 'asc' ? delta : -delta;
  });
}

export function trendingArticles(articles: Article[], limit = 4): Article[] {
  return [...articles]
    .filter((article) => article.categorySlug === 'trending')
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
}

export function categoryOptions(articles: Article[]): CategoryOption[] {
  const map = new Map<string, string>();
  for (const article of articles) map.set(article.categorySlug, article.category);
  return [...map.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function pageSlice<T>(items: T[], page: number): T[] {
  const start = (page - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}
