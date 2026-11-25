const FACES = [
  { dx: "-0.5", dy: "-1", points: "256,118 366,182 224,236 146,182", fill: "var(--aether-ice)" },
  { dx: "1", dy: "-0.1", points: "366,182 366,310 224,236", fill: "var(--aether-blue)" },
  { dx: "-1", dy: "0.1", points: "146,182 224,236 146,310", fill: "var(--aether-sky)" },
  { dx: "0.4", dy: "1", points: "366,310 256,374 146,310 224,236", fill: "var(--aether-navy)" },
];

export function AetherChapter() {
  return (
    <section className="chapter aether" id="aether-chapter" data-nav="aether" aria-labelledby="wordmark">
      <div className="track" data-track="aether">
        <span className="jump" id="aether" />
        <div className="pin">
          <div className="lockup">
            <div className="gem-tile">
              <svg viewBox="0 0 512 512" role="img" aria-label="The Aether mark: a hexagon cut into four faces">
                <rect id="gem-bg" width="512" height="512" rx="112" fill="url(#tile-bg)" />
                <g stroke="var(--aether-edge)" strokeWidth="3" strokeLinejoin="round">
                  {FACES.map((f) => <polygon key={f.points} className="face" data-dx={f.dx} data-dy={f.dy} points={f.points} fill={f.fill} />)}
                </g>
              </svg>
            </div>
            <h2 className="wordmark" id="wordmark">Aether</h2>
          </div>
        </div>
      </div>
      <figure className="banner gut">
        <video className="frame" src="media/banner-coast.mp4" poster="media/banner-coast-poster.jpg" width={1280} height={360} muted loop playsInline preload="none" data-autoplay="" aria-label="The Aether mark and wordmark over a coastline photo, with characters shimmering across it" />
      </figure>
    </section>
  );
}
