import { useI18n } from "@/providers/i18n-provider";
import type { ChapterContentProps } from "./chapter-content";
import { StatisticChapter } from "./statistic-chapter";

/** Version A keeps the evidence and source links within three scroll chapters. */
export function EvidenceGroup(props: ChapterContentProps) {
  const { t } = useI18n();
  const key = props.chapter.key;
  if (key === "dor") return <StatisticChapter {...props} />;
  return (
    <div className="flow-evidence-group">
      <StatisticChapter {...props} />
      <aside className="flow-evidence-aside lp-container">
        {key === "interviews" ? (
          <>
            <strong className="flow-evidence-number">{t("landing.demoFlow.groupSilence")}</strong>
            <div>
              <p>{t("landing.demoFlow.groupSilenceText")}</p>
              <a
                href="https://universodoseguro.com.br/60-dos-candidatos-nao-recebem-retorno-apos-aplicarem-para-vagas/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("landing.statistics.silence.source")} ↗
              </a>
            </div>
          </>
        ) : (
          <>
            <strong className="flow-evidence-number">88%</strong>
            <div>
              <h3>{t("landing.demoFlow.groupFilters")}</h3>
              <p>{t("landing.demoFlow.groupFiltersText")}</p>
              <p>{t("landing.statistics.qualified.body")}</p>
              <a
                href="https://www.hbs.edu/managing-the-future-of-work/Documents/research/hiddenworkers09032021.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("landing.statistics.qualified.source")} ↗
              </a>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
