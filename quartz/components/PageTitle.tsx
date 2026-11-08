import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

// Logo：三個節點的連線（Connecting ideas）＋ 文字句點用 Highlight 橘
const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const name = title.replace(/\.$/, "")
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir} class="jn-logo">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <path
            d="M6 22 L15 8 L24 18"
            fill="none"
            stroke="var(--primary)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle cx="6" cy="22" r="3.5" fill="var(--primary)" />
          <circle cx="15" cy="8" r="3.5" fill="var(--primary)" />
          <circle cx="24" cy="18" r="4" fill="var(--hl)" />
        </svg>
        <span>
          {name}
          <span class="dot">.</span>
        </span>
      </a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
