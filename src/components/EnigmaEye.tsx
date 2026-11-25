const ALMOND = "M4 30 Q50 -6 96 30 Q50 66 4 30 Z";

export function EnigmaEye() {
  return (
    <svg viewBox="0 0 100 60" aria-hidden="true">
      <defs><clipPath id="eye-clip"><path d={ALMOND} /></clipPath></defs>
      <path className="eye-white" d={ALMOND} />
      <g clipPath="url(#eye-clip)">
        <g id="eye-gaze">
          <circle className="eye-pupil" cx="50" cy="30" r="21" />
          <circle className="eye-glint" cx="57" cy="23" r="3.2" />
        </g>
      </g>
    </svg>
  );
}
