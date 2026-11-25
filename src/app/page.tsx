import { About } from "@/components/About";
import { AetherChapter } from "@/components/AetherChapter";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { LegacyScripts } from "@/components/LegacyScripts";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Sprite } from "@/components/Sprite";
import { Work } from "@/components/Work";

export default function Page() {
  return (
    <>
      <Sprite />
      <div className="stage" id="stage" aria-hidden="true">
        <canvas />
        <p className="nogl-note">WebGL is off in this browser.</p>
      </div>
      <SiteHeader />
      <main>
        <Hero />
        <AetherChapter />
        <Work />
        <About />
        <Contact />
      </main>
      <SiteFooter />
      <LegacyScripts />
    </>
  );
}
