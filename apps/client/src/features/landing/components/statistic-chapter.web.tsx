import { landingScrollPalette } from "@patch-careers/tokens";
import { useWindowDimensions } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { landingSans } from "../lib/landing-fonts";
import { STATISTIC_GREEN, STATISTIC_LIME, STATISTIC_PAPER } from "../lib/statistic-theme";
import type { ChapterContentProps } from "./chapter-content";

const HIDDEN_WORKERS =
  "https://www.hbs.edu/managing-the-future-of-work/Documents/research/hiddenworkers09032021.pdf";
const SOURCES: Record<string, string> = {
  robo: "https://business.linkedin.com/hire/resources/future-of-recruiting",
  filter: HIDDEN_WORKERS,
  qualified: HIDDEN_WORKERS,
  dor: "https://www.theladders.com/career-advice/why-do-recruiters-spend-only-7-4-seconds-on-resumes",
  interviews: "https://www.careerplug.com/how-to-use-recruiting-metrics-to-hire-better/",
  silence:
    "https://universodoseguro.com.br/60-dos-candidatos-nao-recebem-retorno-apos-aplicarem-para-vagas/",
};
export function StatisticChapter({ chapter, width }: ChapterContentProps) {
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const compact = width < 1024;
  const robot = chapter.key === "filter";
  const adoption = chapter.key === "robo";
  const typographic = chapter.key === "qualified";
  const key = `landing.statistics.${chapter.key}`;
  return (
    <section
      data-testid={`landing-statistic-${chapter.key}`}
      aria-labelledby={`statistic-${chapter.key}`}
      style={{
        minHeight: height,
        boxSizing: "border-box",
        padding: compact ? (adoption ? "100px 24px 70px" : "110px 24px 100px") : "120px 8% 100px",
        display: "grid",
        gridTemplateColumns: compact || typographic ? "1fr" : "1.15fr 1fr",
        gap: compact ? (adoption ? 24 : 36) : adoption ? "7%" : "9%",
        alignItems: "center",
        color: STATISTIC_PAPER,
        fontFamily: landingSans,
      }}
    >
      <div style={{ maxWidth: typographic ? 960 : undefined }}>
        {chapter.key === "qualified" && (
          <h2
            id="statistic-qualified"
            style={{
              fontSize: compact ? 32 : "clamp(34px, 3.3vw, 62px)",
              lineHeight: 1.12,
              letterSpacing: "-0.055em",
              fontWeight: 450,
              margin: "0 0 36px",
              maxWidth: 820,
            }}
          >
            {t(`${key}.heading`)}
          </h2>
        )}
        {t(`${key}.number`) && (
          <div
            style={{
              fontSize: compact ? "clamp(64px, 15vw, 112px)" : "clamp(100px, 10.5vw, 190px)",
              lineHeight: 1,
              letterSpacing: "-0.075em",
              fontWeight: 450,
              whiteSpace: "nowrap",
              marginBottom: typographic ? 12 : 32,
            }}
          >
            {t(`${key}.number`)}
            {chapter.key === "dor" && (
              <span style={{ color: STATISTIC_LIME, fontSize: "0.5em", letterSpacing: "-0.04em" }}>
                s
              </span>
            )}
          </div>
        )}
        {chapter.key !== "qualified" && (
          <h2
            id={`statistic-${chapter.key}`}
            style={{
              fontSize: compact ? 32 : "clamp(34px, 3.3vw, 62px)",
              lineHeight: 1.12,
              letterSpacing: "-0.055em",
              fontWeight: 450,
              margin: 0,
            }}
          >
            {t(`${key}.heading`)}
          </h2>
        )}
        {t(`${key}.body`) && (
          <p
            style={{
              color: landingScrollPalette.statisticMuted,
              fontSize: compact || robot ? 16 : 18,
              lineHeight: 1.7,
              maxWidth: typographic ? 680 : 450,
              margin: chapter.key === "qualified" ? "0" : "30px 0 0",
            }}
          >
            {t(`${key}.body`)}
          </p>
        )}
        <a
          href={SOURCES[chapter.key]}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            color: STATISTIC_PAPER,
            fontSize: 11,
            lineHeight: 1.7,
            textUnderlineOffset: 5,
            marginTop: compact ? 28 : 48,
          }}
        >
          {t(`${key}.source`)} ↗
        </a>
      </div>
      {adoption && <AdoptionChart compact={compact} />}
      {!typographic && !adoption && (
        <div
          aria-hidden="true"
          style={{ width: "100%", maxWidth: compact ? 300 : 520, justifySelf: "center" }}
        >
          {robot ? (
            <ResumeFilter />
          ) : chapter.key === "dor" ? (
            <Hourglass />
          ) : chapter.key === "interviews" ? (
            <People />
          ) : (
            <Silence />
          )}
        </div>
      )}
    </section>
  );
}
function AdoptionChart({ compact }: { compact: boolean }) {
  const { t } = useI18n();
  const key = "landing.statistics.robo";
  return (
    <figure
      data-testid="landing-ai-adoption-chart"
      // @style-allow inline: semantic figure layout has no Tamagui equivalent in this web-only SVG chart
      style={{ margin: 0, width: "100%", maxWidth: 520, justifySelf: "center" }}
    >
      <div style={{ color: STATISTIC_LIME, fontSize: compact ? 22 : 28, letterSpacing: "-0.04em" }}>
        {t(`${key}.chartChange`)}
      </div>
      <svg
        role="img"
        aria-label={t(`${key}.chartLabel`)}
        viewBox="0 0 480 350"
        // @style-allow inline: responsive SVG sizing must remain on the native web element
        style={{ display: "block", width: "100%", marginTop: 16 }}
      >
        {[0, 20, 40].map((value) => (
          <g key={value}>
            <line
              x1="44"
              x2="472"
              y1={290 - value * 6}
              y2={290 - value * 6}
              stroke={landingScrollPalette.statisticMuted}
              strokeOpacity={value === 0 ? 0.4 : 0.15}
            />
            <text
              x="0"
              y={295 - value * 6}
              fill={landingScrollPalette.statisticMuted}
              fontSize="12"
            >
              {value}%
            </text>
          </g>
        ))}
        {[
          { year: "2024", value: 27, x: 96 },
          { year: "2025", value: 37, x: 300 },
        ].map(({ year, value, x }) => (
          <g key={year}>
            <rect
              x={x}
              y={290 - value * 6}
              width="112"
              height={value * 6}
              rx="4"
              fill={year === "2025" ? STATISTIC_LIME : landingScrollPalette.chartSecondary}
            />
            <text
              x={x + 56}
              y={274 - value * 6}
              textAnchor="middle"
              fill={year === "2025" ? STATISTIC_LIME : STATISTIC_PAPER}
              fontSize="38"
              letterSpacing="-2"
            >
              {value}%
            </text>
            <text x={x + 56} y="321" textAnchor="middle" fill={STATISTIC_PAPER} fontSize="16">
              {year}
            </text>
          </g>
        ))}
      </svg>
      <figcaption
        // @style-allow inline: semantic chart caption stays co-located with its web-only figure
        style={{ color: landingScrollPalette.statisticMuted, fontSize: 12, lineHeight: 1.7 }}
      >
        {t(`${key}.chartCaption`)}
        <br />
        {t(`${key}.chartEditions`)} · 2024–2025
      </figcaption>
    </figure>
  );
}

function People() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 500 500"
      // @style-allow inline: responsive illustration sizing belongs to its web SVG host
      style={{ display: "block", width: "100%" }}
    >
      <defs>
        <g id="statistic-person">
          <circle cx="12" cy="5" r="4.5" />
          <path d="M9 12h6c6 0 9 4 9 10v10a2.5 2.5 0 0 1-5 0V22a1 1 0 0 0-2 0v23a2.5 2.5 0 0 1-5 0V33a1 1 0 0 0-2 0v12a2.5 2.5 0 0 1-5 0V22a1 1 0 0 0-2 0v10a2.5 2.5 0 0 1-5 0V22c0-6 4-10 11-10Z" />
        </g>
      </defs>
      {Array.from({ length: 100 }, (_, id) => id).map((i) => (
        <use
          key={i}
          href="#statistic-person"
          data-interviewed={i >= 44 && i <= 46}
          x={14 + (i % 10) * 49}
          y={Math.floor(i / 10) * 50}
          fill={i >= 44 && i <= 46 ? STATISTIC_LIME : landingScrollPalette.figureMuted}
          opacity={i >= 44 && i <= 46 ? 1 : 0.72}
        />
      ))}
    </svg>
  );
}
function Silence() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 500 250"
      // @style-allow inline: responsive illustration sizing belongs to its web SVG host
      style={{ display: "block", width: "100%" }}
    >
      {Array.from({ length: 10 }, (_, id) => id).map((i) => (
        <circle
          key={i}
          cx={42 + (i % 5) * 104}
          cy={62 + Math.floor(i / 5) * 124}
          r={28}
          fill={i < 6 ? "none" : STATISTIC_LIME}
          stroke={i < 6 ? landingScrollPalette.figureMuted : "none"}
          strokeWidth={7}
        />
      ))}
    </svg>
  );
}
function Hourglass() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 500"
      // @style-allow inline: responsive illustration sizing belongs to its web SVG host
      style={{ width: "100%", maxHeight: "60vh", display: "block" }}
    >
      <defs>
        <linearGradient id="statistic-glass">
          <stop stopColor={STATISTIC_PAPER} stopOpacity=".22" />
          <stop offset=".5" stopColor={STATISTIC_PAPER} stopOpacity=".04" />
          <stop offset="1" stopColor={STATISTIC_PAPER} stopOpacity=".18" />
        </linearGradient>
      </defs>
      <path
        d="M70 55H330L200 248 330 445H70L200 248Z"
        fill="url(#statistic-glass)"
        stroke={landingScrollPalette.glassStroke}
        strokeOpacity=".35"
        strokeWidth="2"
      />
      <path d="M155 180H245L200 248Z M200 300L294 437Q200 463 106 437Z" fill={STATISTIC_LIME} />
      <path d="M200 249V300" stroke={STATISTIC_LIME} strokeWidth="5" />
      <path
        d="M58 54V444M342 54V444"
        stroke={landingScrollPalette.chartSecondary}
        strokeWidth="12"
      />
      <ellipse cx="200" cy="446" rx="156" ry="25" fill={landingScrollPalette.hourglassBase} />
      <path
        d="M44 446V460Q200 502 356 460V446Q200 485 44 446"
        fill={landingScrollPalette.hourglassEdge}
      />
      <ellipse cx="200" cy="47" rx="156" ry="24" fill={landingScrollPalette.chartSecondary} />
      <path
        d="M44 47V64Q200 100 356 64V47Q200 84 44 47"
        fill={landingScrollPalette.hourglassEdge}
      />
    </svg>
  );
}

function ResumeFilter() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 500 320"
      // @style-allow inline: responsive illustration sizing belongs to its web SVG host
      style={{ display: "block", width: "100%", maxHeight: "34vh" }}
    >
      <g
        fill="none"
        stroke={landingScrollPalette.figureMuted}
        strokeWidth="3"
        strokeLinejoin="round"
      >
        <rect x="38" y="68" width="104" height="144" rx="8" transform="rotate(-12 90 140)" />
        <rect x="56" y="78" width="104" height="144" rx="8" />
        <path d="M77 107h48m-48 23h62m-62 23h62m-62 23h39" />
        <path d="M172 149h44m-11-10 11 10-11 10" stroke={STATISTIC_LIME} />
        <rect
          x="240"
          y="66"
          width="200"
          height="157"
          rx="30"
          fill={landingScrollPalette.robotShell}
        />
        <path d="M340 66V40m-100 82h-16v49h16m200-49h16v49h-16M294 245v25m92-25v25" />
        <circle cx="340" cy="30" r="10" fill={STATISTIC_LIME} stroke="none" />
        <rect x="265" y="94" width="150" height="71" rx="18" fill={STATISTIC_GREEN} />
        <path d="M294 189h92" stroke={STATISTIC_LIME} strokeLinecap="round" />
      </g>
      <circle cx="306" cy="129" r="11" fill={STATISTIC_LIME} />
      <circle cx="374" cy="129" r="11" fill={STATISTIC_LIME} />
      <path
        d="M64 281h377"
        stroke={landingScrollPalette.figureMuted}
        strokeOpacity=".35"
        strokeWidth="2"
      />
    </svg>
  );
}
