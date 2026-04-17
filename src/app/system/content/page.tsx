'use client';

import Link from 'next/link';
import type { ContentRoutes } from '@/context/ContentRoutesContext';
import { useContentRoutes } from '@/context/ContentRoutesContext';

type ContentHubKey = keyof Pick<ContentRoutes, 'pages' | 'metaobjects' | 'files' | 'menus' | 'blogPosts'>;

const cards: { title: string; description: string; key: ContentHubKey }[] = [
  {
    title: 'Pages',
    description: 'Theme templates, sections, and storefront pages.',
    key: 'pages',
  },
  {
    title: 'Metaobjects',
    description: 'Structured content definitions and entries.',
    key: 'metaobjects',
  },
  {
    title: 'Files',
    description: 'Upload and manage media for the selected store.',
    key: 'files',
  },
  {
    title: 'Menus',
    description: 'Navigation menus and links.',
    key: 'menus',
  },
  {
    title: 'Blog posts',
    description: 'Create and publish blog content.',
    key: 'blogPosts',
  },
];

export default function SystemContentHubPage() {
  const routes = useContentRoutes();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ title, description, key }) => {
        const href = routes[key] as string;
        return (
          <Link
            key={key}
            href={href}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-mint/40 hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-mint-dark">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{description}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-mint group-hover:underline">Open →</span>
          </Link>
        );
      })}
    </div>
  );
}
