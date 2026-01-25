import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import CustomContentMeta from "./quartz/components/CustomContentMeta"

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
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/GoblinCw",
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
    Component.Explorer(),
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
    Component.Explorer(),
  ],
  right: [],
}