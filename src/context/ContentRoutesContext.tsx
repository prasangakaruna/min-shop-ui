'use client';

import React, { createContext, useContext, useMemo } from 'react';

export type ContentRoutes = {
  base: string;
  pages: string;
  pagesNew: string;
  page: (id: string | number) => string;
  pagePreview: (id: string | number) => string;
  metaobjects: string;
  metaobject: (id: string | number) => string;
  files: string;
  menus: string;
  menu: (id: string | number) => string;
  /** Query-style blog hub (legacy admin route shape). */
  blogPosts: string;
};

function buildContentRoutes(basePath: string): ContentRoutes {
  const b = basePath.replace(/\/$/, '');
  return {
    base: b,
    pages: `${b}/pages`,
    pagesNew: `${b}/pages/new`,
    page: (id) => `${b}/pages/${id}`,
    pagePreview: (id) => `${b}/pages/${id}/preview`,
    metaobjects: `${b}/metaobjects`,
    metaobject: (id) => `${b}/metaobjects/${id}`,
    files: `${b}/files`,
    menus: `${b}/menus`,
    menu: (id) => `${b}/menus/${id}`,
    blogPosts: `${b}/blog`,
  };
}

const defaultRoutes = buildContentRoutes('/admin/content');

const ContentRoutesContext = createContext<ContentRoutes>(defaultRoutes);

export function ContentRoutesProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  const value = useMemo(() => buildContentRoutes(basePath), [basePath]);
  return <ContentRoutesContext.Provider value={value}>{children}</ContentRoutesContext.Provider>;
}

export function useContentRoutes(): ContentRoutes {
  return useContext(ContentRoutesContext);
}
