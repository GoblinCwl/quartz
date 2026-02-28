import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import CustomContentMeta from "./quartz/components/CustomContentMeta"

// 自定义排序函数
const customSortFunction = (a: any, b: any) => {
  // 定义排序映射
  const orderMap: Record<string, number> = {
    "Temp": 1,
    "Private": 2,
    "Memo": 3,
    "Study": 4,
    "Work": 5,
    "Game": 6,
    "Resources": 7,
    // 添加更多自定义排序
  };

  // 尝试从映射中获取排序值，如果没有则使用默认排序
  const orderA = orderMap[a.slugSegment] ?? Number.MAX_SAFE_INTEGER;
  const orderB = orderMap[b.slugSegment] ?? Number.MAX_SAFE_INTEGER;

  // 如果都有指定排序，则按指定排序
  if (orderA !== Number.MAX_SAFE_INTEGER || orderB !== Number.MAX_SAFE_INTEGER) {
    return orderA - orderB;
  }

  // 否则使用默认排序：文件夹优先，然后按字母顺序
  if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
    return a.displayName.localeCompare(b.displayName, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  if (!a.isFolder && b.isFolder) {
    return 1;
  } else {
    return -1;
  }
};

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.ArtalkComments({
      server: 'https://artalk.goblincwl.site',
      site: 'CwlLibrary',
      useBackendConf: true
    }),
    Component.Subscript(),
  ],
  footer: Component.Footer({
    links: {
      "湘ICP备2026004810号": "http://beian.miit.gov.cn",
      GitHub: "https://github.com/GoblinCwl",
      "Bilibili" :"https://space.bilibili.com/13536815",
      "Steam": "https://steamcommunity.com/id/goblincwl/"
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    CustomContentMeta({
      showReadingTime: false,
      datePrefix: "更新于：",
      includeSeconds: true
    }),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      sortFn: customSortFunction,
    }),
    Component.DesktopOnly(
      Component.RecentNotes({
        title: "最近在写" ,
        limit: 5,
        showTags: false
      }),
    ),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
    Component.ScrollButton({
      position: "bottom-right",
      showOnlyOnDesktop: true
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      sortFn: customSortFunction,
    }),
    Component.DesktopOnly(
        Component.RecentNotes({
          title: "最近在写" ,
          limit: 5,
          showTags: false
        }),
    ),
  ],
  right: [],
}