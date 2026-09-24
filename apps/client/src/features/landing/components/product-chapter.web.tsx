import type { ReactElement } from "react";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useAppRouter } from "@/navigation/use-app-router";
import { useI18n } from "@/providers/i18n-provider";
import { isStatisticChapter } from "../lib/statistic-theme";
import { DEMO_SCORES } from "../model/demo-data";
import type { ChapterContentProps } from "./chapter-content";
import { ChapterLayer } from "./chapter-frame";
import { HeroResumeComparison } from "./hero-resume-comparison.web";
import { ScrollDemo } from "./scroll-demo.web";
import { StatisticChapter } from "./statistic-chapter";

function scoreTone(value: number): "red" | "orange" | "yellow" | "light-green" | "dark-green" {
  if (value >= 90) return "dark-green";
  if (value >= 75) return "light-green";
  if (value >= 60) return "yellow";
  if (value >= 40) return "orange";
  return "red";
}

/** Product demonstrations remain fully readable while the chapter camera follows the scroll. */
export function ProductChapter(props: ChapterContentProps): ReactElement | null {
  const { chapter } = props;
  const { t } = useI18n();
  const router = useAppRouter();
  const localized = useLocalizedHref();
  const copy = (key: string) => t(`landing.scroll.${key}`);
  const signUp = () => router.push(localized("/(auth)/auth"));
  if (isStatisticChapter(chapter.key)) return <StatisticChapter {...props} />;
  switch (chapter.key) {
    case "hero":
      return (
        <section
          className="lp-hero lp-container"
          data-section="hero"
          aria-labelledby="lp-hero-title"
        >
          <ChapterLayer depth={0}>
            <div className="lp-hero-copy">
              <h1 id="lp-hero-title">
                {copy("heroLead")}
                <br />
                <span>{copy("heroEnd")}</span>
              </h1>
              <p className="lp-body">{copy("heroBody")}</p>
              <div className="lp-actions">
                <button type="button" className="lp-button" onClick={signUp}>
                  {copy("start")} <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </ChapterLayer>
          <HeroResumeComparison />
        </section>
      );
    case "vivo":
      return (
        <section className="lp-product lp-container">
          <ChapterLayer depth={0}>
            <div className="lp-section-heading">
              <h2>{t("landing.demoFlow.requirementsTitle")}</h2>
              <p className="lp-body">{t("landing.demoFlow.requirementsBody")}</p>
            </div>
          </ChapterLayer>
          <ScrollDemo mode="requirements" />
        </section>
      );
    case "notas":
      return (
        <section className="lp-scores" data-section="notas" aria-labelledby="lp-scores-title">
          <div className="lp-container">
            <ChapterLayer depth={0}>
              <div className="lp-section-heading">
                <h2 id="lp-scores-title">{copy("scoresTitle")}</h2>
                <p className="lp-body">{copy("scoresBody")}</p>
              </div>
            </ChapterLayer>
            <ChapterLayer depth={2}>
              <div className="lp-score-grid">
                {DEMO_SCORES.map((score) => (
                  <article
                    className={`lp-score-card lp-score-card-${scoreTone(score.value)}`}
                    key={score.key}
                  >
                    <h3>{t(`landing.scores.${score.key}.name`)}</h3>
                    <div className={`lp-score-number lp-score-number-${scoreTone(score.value)}`}>
                      {score.value}
                      <small>/100</small>
                    </div>
                    <div className="lp-meter" aria-hidden="true">
                      <span style={{ width: `${score.value}%` }} />
                    </div>
                    <p>{t(`landing.scores.${score.key}.what`)}</p>
                    <div className="lp-score-explanation">
                      <strong>{t("landing.scores.whyLabel")}</strong>
                      <p>{t(`landing.scores.${score.key}.why`)}</p>
                      <strong>{t("landing.scores.fixLabel")}</strong>
                      <p>{t(`landing.scores.${score.key}.fix`)}</p>
                    </div>
                    {score.sub && (
                      <div className="lp-sub-scores">
                        <p className="lp-kicker">{copy("details")}</p>
                        {score.sub.map((sub) => (
                          <div key={sub.key}>
                            <div>
                              <span>{t(`landing.scores.sub.${sub.key}.name`)}</span>
                              <strong className={`lp-score-number-${scoreTone(sub.value)}`}>
                                {sub.value}
                              </strong>
                            </div>
                            <p>{t(`landing.scores.sub.${sub.key}.fix`)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </ChapterLayer>
          </div>
        </section>
      );
    case "auto":
      return (
        <section
          className="lp-workflow lp-container"
          data-section="auto"
          aria-labelledby="lp-workflow-title"
        >
          <ChapterLayer depth={0}>
            <div className="lp-section-heading">
              <p className="lp-kicker">{copy("workflowTag")}</p>
              <h2 id="lp-workflow-title">{copy("workflowTitle")}</h2>
              <p className="lp-body">{copy("workflowBody")}</p>
            </div>
          </ChapterLayer>
          <ChapterLayer depth={2}>
            <ol className="lp-steps">
              {[1, 2, 3].map((step) => (
                <li key={step}>
                  <span className="lp-step-number">0{step}</span>
                  <h3>{copy(`step${step}Title`)}</h3>
                  <p>{copy(`step${step}Body`)}</p>
                </li>
              ))}
            </ol>
          </ChapterLayer>
        </section>
      );
    case "cta":
      return (
        <>
          <section className="lp-closing" data-section="cta" aria-labelledby="lp-closing-title">
            <div className="lp-container">
              <h2 id="lp-closing-title">{copy("closingTitle")}</h2>
              <div className="lp-closing-bottom">
                <p className="lp-body">{copy("closingBody")}</p>
                <div>
                  <button
                    type="button"
                    data-testid="landing-cta-sign-up"
                    className="lp-button"
                    onClick={signUp}
                  >
                    {t("landing.chapters.cta.button")} <span aria-hidden="true">↗</span>
                  </button>
                  <button
                    type="button"
                    className="lp-note lp-link"
                    onClick={() => router.push(localized("/go"))}
                  >
                    {t("go.title")} · {t("go.brlPrice")}
                  </button>
                  <p className="lp-note">{t("landing.chapters.cta.noCard")}</p>
                </div>
              </div>
            </div>
          </section>
          <footer className="lp-footer lp-container">
            <span>{t("landing.footer.copyright")}</span>
            <div>
              {["privacy", "terms"].map((kind) => (
                <a
                  key={kind}
                  href={`https://patchcareers.org/${kind}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t(`landing.footer.${kind}`)}
                </a>
              ))}
            </div>
          </footer>
        </>
      );
    default:
      return null;
  }
}
