const SECTIONS = [
  { href: "#aether", label: "Aether" },
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
];

export function SiteHeader() {
  return (
    <>
      <header className="bar" id="bar">
        <a className="wordname" id="wordname" href="#top">Harry Xie</a>
        <nav className="navpill" aria-label="Sections">
          {SECTIONS.map((s) => <a key={s.href} href={s.href}>{s.label}</a>)}
        </nav>
        <a className="pill to-contact" href="#contact">Contact</a>
        <button className="pill menu-btn" type="button" id="menu-open" aria-haspopup="dialog">Menu</button>
      </header>
      <dialog className="drawer" id="drawer" aria-label="Menu">
        <div className="drawer-in">
          <div className="drawer-top">
            <span className="wordname">Harry Xie</span>
            <button className="pill" type="button" id="menu-close">Close</button>
          </div>
          <nav className="drawer-links" aria-label="Sections">
            {SECTIONS.map((s) => <a key={s.href} href={s.href}>{s.label}</a>)}
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </dialog>
    </>
  );
}
