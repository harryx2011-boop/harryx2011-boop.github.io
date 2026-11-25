import { profile } from "@/data/profile";

export function Contact() {
  return (
    <section className="contact track" id="contact" data-track="contact">
      <div className="pin">
        <div className="contact-copy">
          <h2 className="big split">Contact</h2>
          <ul className="channels">
            <li>
              <a className="channel" href={`https://github.com/${profile.github}`} target="_blank" rel="noopener">
                <svg aria-hidden="true"><use href="#logo-github" /></svg>
                <span className="title">GitHub</span>
                <span className="handle">{profile.github}</span>
              </a>
            </li>
            <li>
              <button className="channel" type="button" id="copy-discord" aria-label="Discord, o g e x r with a dot at the end. Copy the handle">
                <svg aria-hidden="true"><use href="#logo-discord" /></svg>
                <span className="title">Discord</span>
                <span className="handle" id="discord-handle" aria-live="polite">{profile.discord}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
