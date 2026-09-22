import { Redo } from "lucide-react-native";
import type { ReactNode } from "react";
import { useI18n } from "@/providers/i18n-provider";

/** Two paper documents showing the completed before/after comparison. */
export function HeroResumeComparison() {
  const { t } = useI18n();
  const c = (key: string) => t(`landing.resumeCompare.${key}`);
  return (
    <div className="resume-comparison" data-testid="hero-resume-comparison">
      <div className="resume-comparison-sheets">
        <div className="resume-paper-wrap">
          <article className="resume-paper resume-paper-before">
            <div className="resume-paper-file">
              <span>curriculum.pdf</span>
              <span>01</span>
            </div>
            <header>
              <h3>Camila Ribeiro</h3>
              <p>{c("genericRole")}</p>
              <small>São Paulo, SP · {c("contact")}</small>
            </header>
            <section>
              <h4>{c("summary")}</h4>
              <p>
                <ReviewMark tone="red">{c("originalSummary")}</ReviewMark>
              </p>
            </section>
            <section>
              <h4>{c("experience")}</h4>
              <strong>{c("employer")}</strong>
              <small>2023 — {c("present")}</small>
              <ul>
                <li>
                  <ReviewMark tone="red">{c("originalBullet")}</ReviewMark>
                </li>
                <li>{c("targets")}</li>
                <li>{c("customers")}</li>
              </ul>
            </section>
            <section>
              <h4>{c("skills")}</h4>
              <p>
                <ReviewMark tone="red">{c("originalSkills")}</ReviewMark>
              </p>
            </section>
            <footer>
              <span>Camila Ribeiro</span>
              <span>1 / 1</span>
            </footer>
          </article>
        </div>
        <div className="resume-arrow" aria-hidden="true">
          <Redo size={120} color="currentColor" strokeWidth={2.6} />
        </div>
        <div className="resume-paper-wrap" data-testid="hero-adapted-paper">
          <article className="resume-paper resume-paper-after">
            <div className="resume-paper-file">
              <span>curriculum_vendas.pdf</span>
              <span>02</span>
            </div>
            <header>
              <h3>Camila Ribeiro</h3>
              <p>
                <ReviewMark tone="green">{c("specificRole")}</ReviewMark>
              </p>
              <small>São Paulo, SP · {c("contact")}</small>
            </header>
            <section>
              <h4>{c("summary")}</h4>
              <p>
                <ReviewMark tone="green">{c("adaptedSummary")}</ReviewMark>
              </p>
            </section>
            <section>
              <h4>{c("experience")}</h4>
              <strong>{c("employer")}</strong>
              <small>2023 — {c("present")}</small>
              <ul>
                <li>
                  <ReviewMark tone="green">{c("targets")}</ReviewMark>
                </li>
                <li>
                  <ReviewMark tone="green">{c("customers")}</ReviewMark>
                </li>
                <li>{c("originalBullet")}</li>
              </ul>
            </section>
            <section>
              <h4>{c("skills")}</h4>
              <p>
                <ReviewMark tone="green">{c("adaptedSkills")}</ReviewMark>
              </p>
            </section>
            <footer>
              <span>Camila Ribeiro</span>
              <span>1 / 1</span>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
function ReviewMark({ tone, children }: { tone: "red" | "green"; children: ReactNode }) {
  return <span className={`resume-mark resume-mark-${tone}`}>{children}</span>;
}
