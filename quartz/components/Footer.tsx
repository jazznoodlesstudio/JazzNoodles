import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { SimpleSlug, pathToRoot, resolveRelative } from "../util/path"

// 頁尾依設計稿：Jazznoodles. ＋ 標語 ｜ About · RSS · © 年份 Jazznoodles
export default (() => {
  const Footer: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const slug = fileData.slug!
    return (
      <footer class={`${displayClass ?? ""}`}>
        <div class="jn-footer">
          <div class="jn-footer-brand">
            <span class="jn-footer-name">
              Jazznoodles<span class="dot">.</span>
            </span>
            <span class="jn-footer-tag">Connecting ideas. Creating possibilities.</span>
          </div>
          <nav aria-label="頁尾">
            <a href={resolveRelative(slug, "about" as SimpleSlug)}>About</a>
            <a href={`${pathToRoot(slug)}/index.xml`}>RSS</a>
            <span>© {year} Jazznoodles</span>
          </nav>
        </div>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
