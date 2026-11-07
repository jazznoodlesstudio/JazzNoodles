import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Jazznoodles.",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "zh-TW",
    baseUrl: "jazznoodlesstudio.github.io/JazzNoodles",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: { name: "Manrope", weights: [600, 700, 800] },
        body: { name: "Inter", weights: [400, 500, 600, 700] },
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#F8F7F2", // Background
          lightgray: "#E5E3DC", // Border
          gray: "#687386", // Text Secondary
          darkgray: "#242D40", // Text Primary（內文）
          dark: "#242D40", // Text Primary（標題）
          secondary: "#2B66DC", // 連結／按鈕文字：Primary #3678F6 加深到 AA（4.85:1）
          tertiary: "#1E4FB8", // hover、目前所在頁
          highlight: "rgba(54, 120, 246, 0.10)", // 內部連結底色（Primary 10%）
          textHighlight: "#F2A36B66", // ==重點== 螢光筆（Highlight 橘）
        },
        darkMode: {
          light: "#171C28",
          lightgray: "#354157",
          gray: "#A5B0C2",
          darkgray: "#E9EDF5",
          dark: "#E9EDF5",
          secondary: "#6D9EFF",
          tertiary: "#9DBBFF",
          highlight: "rgba(109, 158, 255, 0.14)",
          textHighlight: "#FFB27F55",
        },
      },
    },

  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.FirstImageCover(), // Jazznoodles：文章列表卡片的封面
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
