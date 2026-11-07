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
        header: "Nunito",
        body: "Noto Sans TC",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#F8FAFF", // Cloud White 背景
          lightgray: "#E3EBF8",
          gray: "#9AAAC6",
          darkgray: "#3C4A66",
          dark: "#14284F", // 內文深藍
          secondary: "#1E63D1", // Ocean Blue：Logo、連結、按鈕
          tertiary: "#6FB6FF", // Sky Blue：hover
          highlight: "rgba(111, 182, 255, 0.15)",
          textHighlight: "#FFD16699", // Sunshine Yellow 螢光筆
        },
        darkMode: {
          light: "#0D1B3A",
          lightgray: "#1F3157",
          gray: "#5C6E94",
          darkgray: "#D5DEF0",
          dark: "#F8FAFF",
          secondary: "#6FB6FF",
          tertiary: "#FFD166",
          highlight: "rgba(111, 182, 255, 0.16)",
          textHighlight: "#FFD16655",
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
