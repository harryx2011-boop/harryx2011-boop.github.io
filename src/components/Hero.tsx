export function Hero() {
  return (
    <section className="hero track" id="top" data-track="hero">
      <div className="pin">
        <div className="hero-copy" id="hero-copy">
          <h1 className="say">
            Hi. I&rsquo;m Harry (or I can go by Elixir). I am the founder of{" "}
            <span className="mark"><svg className="gem-inline" aria-hidden="true"><use href="#gem" /></svg>Aether,</span>{" "}
            an AI research lab contributing to the next frontier.
          </h1>
          <div className="act"><a className="pill" href="#aether">Enter Aether</a></div>
        </div>
      </div>
    </section>
  );
}
