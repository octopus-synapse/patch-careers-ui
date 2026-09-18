import { motion, useTransform } from "framer-motion";
import { useI18n } from "@/providers/i18n-provider";
import { useChapterMotion } from "../hooks/use-chapter-motion.web";

export function ScrollDemo({
  mode = "rewrite",
}: {
  mode?: "rewrite" | "requirements" | "versions";
}) {
  const { t } = useI18n();
  const c = (key: string) => t(`landing.demoFlow.${key}`);
  const { progress, travel, reduced, compact } = useChapterMotion();
  const p = useTransform(() => (reduced ? 1 : progress.get()));
  const originalY = useTransform(() => (reduced ? 0 : -p.get() * 10 - travel.get() * 28));
  const originalRotate = useTransform(() => (reduced || compact ? 0 : -5 + p.get() * 5));
  const jobX = useTransform(() => (reduced ? 0 : (1 - p.get()) * 34 + travel.get() * 85));
  const afterY = useTransform(() => (reduced ? 0 : (1 - p.get()) * 100 - travel.get() * 125));
  const afterRotate = useTransform(() => (reduced || compact ? 0 : (1 - p.get()) * 8));
  const afterOpacity = useTransform(p, [0, 0.2, 0.7], [0.2, 0.35, 1]);
  const afterClip = useTransform(
    p,
    [0, 1],
    ["inset(0 0 78% 0 round 12px)", "inset(0 0 0% 0 round 12px)"],
  );
  const supportX = useTransform(() => (reduced || compact ? 0 : (1 - p.get()) * 36));
  const versionY = useTransform(() => (reduced ? 0 : (1 - p.get()) * 18 - travel.get() * 20));
  const originalScale = useTransform(() => (reduced ? 1 : 1 - p.get() * 0.035));
  if (mode === "requirements")
    return (
      <div className="flow-connections" data-testid="flow-requirements">
        <p className="lp-kicker">{c("connections")}</p>
        {[1, 2, 3].map((n) => (
          <Requirement key={n} n={n} />
        ))}
        <p className="lp-note">{c("example")}</p>
      </div>
    );
  if (mode === "versions")
    return (
      <div className="flow-versions" data-testid="flow-versions">
        <motion.div className="flow-source" style={{ y: originalY, scale: originalScale }}>
          <p className="lp-kicker">{c("source")}</p>
          <p>{c("sourceText")}</p>
        </motion.div>
        <div className="flow-two">
          <motion.article className="flow-version" style={{ y: versionY }}>
            <div className="flow-version-meta">
              <span aria-hidden="true">01</span>
              <p className="lp-kicker">{c("salesFocus")}</p>
            </div>
            <h3>{c("sales")}</h3>
            <p>{c("salesText")}</p>
          </motion.article>
          <motion.article className="flow-version" style={{ x: supportX, y: versionY }}>
            <div className="flow-version-meta">
              <span aria-hidden="true">02</span>
              <p className="lp-kicker">{c("supportFocus")}</p>
            </div>
            <h3>{c("support")}</h3>
            <p>{c("supportText")}</p>
          </motion.article>
        </div>
        <p className="lp-note">
          {c("example")} · {c("scroll")}
        </p>
      </div>
    );
  return (
    <div className="flow-stage" data-testid="flow-rewrite">
      <motion.div className="flow-job" style={{ x: jobX }}>
        <p className="lp-kicker">{c("job")}</p>
        <strong>{c("role")}</strong>
        <div className="flow-tags">
          {[1, 2, 3].map((n) => (
            <span key={n}>{c(`req${n}`)}</span>
          ))}
        </div>
      </motion.div>
      <motion.article
        className="flow-document flow-original"
        style={{ y: originalY, rotate: originalRotate }}
      >
        <p className="lp-kicker">{c("before")}</p>
        <p>{c("beforeText")}</p>
      </motion.article>
      <motion.article
        className="flow-document flow-adapted flow-result"
        data-testid="flow-result"
        style={{
          y: afterY,
          rotate: afterRotate,
          opacity: reduced ? 1 : afterOpacity,
          clipPath: reduced ? "none" : afterClip,
        }}
      >
        <p className="lp-kicker">{c("after")}</p>
        <p>
          {c("afterLead")} <mark>{c("afterMark")}</mark> {c("afterTail")}
        </p>
        <div className="flow-explanation">{c("changed")}</div>
      </motion.article>
      <p className="flow-caption">
        {c("example")}
        <br />
        {c("scroll")} <span aria-hidden="true">↓</span>
      </p>
    </div>
  );
}
function Requirement({ n }: { n: number }) {
  const { t } = useI18n();
  const { progress, travel, reduced, compact } = useChapterMotion();
  const p = useTransform(() =>
    reduced ? 1 : Math.max(0, Math.min(1, (progress.get() - (n - 1) * 0.25) / 0.4)),
  );
  const x = useTransform(() => (reduced || compact ? 0 : (1 - p.get()) * 65));
  const y = useTransform(() => (reduced ? 0 : (1 - p.get()) * 25 - travel.get() * n * 30));
  const opacity = useTransform(p, [0, 1], [0.25, 1]);
  return (
    <motion.div className="flow-connection" style={{ y }}>
      <span className="flow-requirement">
        <small>0{n}</small>
        {t(`landing.demoFlow.req${n}`)}
      </span>
      <div className="flow-line" aria-hidden="true">
        <motion.span style={{ scaleX: p }} />
      </div>
      <motion.strong style={{ x, opacity }}>{t(`landing.demoFlow.proof${n}`)}</motion.strong>
    </motion.div>
  );
}
