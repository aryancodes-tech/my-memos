import {
  LANDING_FEATURES_DESC,
  LANDING_FEATURES_EYEBROW,
  LANDING_FEATURES_TITLE,
  LANDING_FEATURE_CLIP_BASE,
  LANDING_FEATURE_CLIPS_ENABLED,
} from "@/lib/constants";

/** Layout span for a single bento grid cell on a 12-column grid. */
type BentoSpan = {
  /** Number of columns the tile spans at the lg breakpoint. */
  col: number;
  /** Number of rows the tile spans. */
  row: number;
};

/** One feature tile in the landing bento grid with an optional demo clip. */
type FeatureTile = {
  id: string;
  title: string;
  description: string;
  tag: string;
  /** Filename under LANDING_FEATURE_CLIP_BASE, e.g. "editor.mp4". */
  clipFilename: string;
  span: BentoSpan;
};

const FEATURE_TILES: FeatureTile[] = [
  {
    id: "storage",
    title: "Local block storage",
    description: "Structured notes in your browser-fast, private, and available offline.",
    tag: "Storage",
    clipFilename: "storage.mp4",
    span: { col: 5, row: 2 },
  },
  {
    id: "new-tab",
    title: "Replaces your New Tab",
    description: "Every ⌘T opens your workspace. Capture a thought before it disappears.",
    tag: "Core",
    clipFilename: "workspace.mp4",
    span: { col: 4, row: 1 },
  },
  {
    id: "themes",
    title: "7 built-in themes",
    description: "Light, Dark, Midnight, Dracula, Solarized, Forest, and Ocean.",
    tag: "Themes",
    clipFilename: "themes.mp4",
    span: { col: 3, row: 1 },
  },
  {
    id: "editor",
    title: "Notion-style editor",
    description: "Slash commands, headings, lists, and code blocks-keyboard-first.",
    tag: "Editor",
    clipFilename: "editor.mp4",
    span: { col: 7, row: 2 },
  },
  {
    id: "search",
    title: "Instant search",
    description: "Jump anywhere with ⌘K. Fuzzy match across titles and body text.",
    tag: "Search",
    clipFilename: "search.mp4",
    span: { col: 3, row: 1 },
  },
  {
    id: "offline",
    title: "Local-first & offline",
    description: "No backend. Your notes never leave your device.",
    tag: "Privacy",
    clipFilename: "offline.mp4",
    span: { col: 2, row: 1 },
  },
];

type FeatureBentoGridProps = {
  /** Optional override for the feature clip base path. */
  clipBasePath?: string;
};

/**
 * Asymmetric bento grid of feature tiles with CSS UI mockups and optional demo clips.
 */
export function FeatureBentoGrid({ clipBasePath = LANDING_FEATURE_CLIP_BASE }: FeatureBentoGridProps) {
  return (
    <section className="landing-bento" aria-labelledby="features-heading">
      <div className="landing-section-header">
        <p className="landing-eyebrow">{LANDING_FEATURES_EYEBROW}</p>
        <h2 id="features-heading" className="landing-section-title">
          {LANDING_FEATURES_TITLE}
        </h2>
        <p className="landing-section-desc">{LANDING_FEATURES_DESC}</p>
      </div>

      <div className="landing-bento-grid">
        {FEATURE_TILES.map((tile) => (
          <BentoTile key={tile.id} tile={tile} clipBasePath={clipBasePath} />
        ))}
      </div>
    </section>
  );
}

type BentoTileProps = {
  tile: FeatureTile;
  clipBasePath: string;
};

/** Single bento cell with UI mockup and optional feature clip. */
function BentoTile({ tile, clipBasePath }: BentoTileProps) {
  const clipSrc =
    LANDING_FEATURE_CLIPS_ENABLED && tile.clipFilename.length > 0
      ? `${clipBasePath}/${tile.clipFilename}`
      : "";

  return (
    <article
      className="landing-bento-tile"
      style={{
        gridColumn: `span ${tile.span.col}`,
        gridRow: `span ${tile.span.row}`,
      }}
    >
      <FeatureClip src={clipSrc} title={tile.title} tileId={tile.id} />

      <div className="landing-bento-content">
        <span className="landing-bento-tag">{tile.tag}</span>
        <h3>{tile.title}</h3>
        <p>{tile.description}</p>
      </div>
    </article>
  );
}

type FeatureClipProps = {
  src: string;
  title: string;
  tileId: string;
};

/** Renders a muted looping feature clip or a CSS UI mockup placeholder. */
function FeatureClip({ src, title, tileId }: FeatureClipProps) {
  const hasSrc = src.length > 0;

  return (
    <div className="landing-bento-visual">
      {hasSrc ? (
        <video
          className="landing-bento-video"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          aria-label={`${title} demo clip`}
          onError={(event) => {
            (event.currentTarget as HTMLVideoElement).style.display = "none";
          }}
        />
      ) : null}

      <div className={`landing-bento-mock landing-bento-mock-${tileId}`}>
        <BentoMock tileId={tileId} />
      </div>
    </div>
  );
}

/** CSS-only mini UI illustration for each feature tile. */
function BentoMock({ tileId }: { tileId: string }) {
  switch (tileId) {
    case "storage":
      return (
        <div className="mock-storage">
          <div className="mock-storage-block mock-storage-block-a" />
          <div className="mock-storage-block mock-storage-block-b" />
          <div className="mock-storage-block mock-storage-block-c" />
        </div>
      );
    case "new-tab":
      return (
        <div className="mock-workspace">
          <div className="mock-workspace-item mock-workspace-item-active" />
          <div className="mock-workspace-item" />
          <div className="mock-workspace-item mock-workspace-item-nested" />
          <div className="mock-workspace-item mock-workspace-item-nested" />
        </div>
      );
    case "editor":
      return (
        <div className="mock-editor">
          <div className="mock-editor-cursor">/</div>
          <div className="mock-editor-menu">
            <span>Heading 1</span>
            <span>Bullet list</span>
            <span>Code block</span>
          </div>
        </div>
      );
    case "themes":
      return (
        <div className="mock-themes">
          {["#ffffff", "#191919", "#0b0d12", "#282a36", "#fdf6e3", "#0f1a14", "#0d1b2a"].map(
            (color) => (
              <span key={color} className="mock-themes-swatch" style={{ background: color }} />
            ),
          )}
        </div>
      );
    case "search":
      return (
        <div className="mock-search">
          <div className="mock-search-bar">⌘K · Search pages…</div>
          <div className="mock-search-result mock-search-result-active" />
          <div className="mock-search-result" />
        </div>
      );
    case "offline":
      return (
        <div className="mock-offline">
          <div className="mock-offline-shield">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2l7 4v6c0 5-3 9-7 10C8 21 5 17 5 12V6l7-4z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <span>100% on-device</span>
        </div>
      );
    default:
      return null;
  }
}
