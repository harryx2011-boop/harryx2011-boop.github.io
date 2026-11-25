import { EnigmaEye } from "@/components/EnigmaEye";
import { profile } from "@/data/profile";

export function About() {
  return (
    <section className="chapter about" id="about">
      <header className="chead gut"><h2>About</h2></header>
      <div className="about-grid gut">
        <img className="frame portrait" src="media/ceres-fauna.jpg" width={400} height={400} alt="Profile picture: a drawing of Ceres Fauna making a peace sign" loading="lazy" />
        <div className="who">
          <h3 className="name">{profile.alias}</h3>
          <div className="likes">
            <h3>Interests</h3>
            <ul className="interests">
              {profile.interests.map((name) => <li key={name}>{name}</li>)}
            </ul>
          </div>
          <button className="eye-btn" type="button" id="eye-open" aria-haspopup="dialog" aria-label="Enigma. Play the video">
            <EnigmaEye />
          </button>
        </div>
      </div>
      <dialog className="reel" id="eye-reel" aria-label="Enigma video">
        <div className="reel-in">
          <video id="eye-video" src={profile.enigmaVideo} controls playsInline preload="none" />
          <p className="reel-note" id="eye-note" hidden>The video is not here yet.</p>
          <button className="pill" type="button" id="eye-close">Close</button>
        </div>
      </dialog>
    </section>
  );
}
