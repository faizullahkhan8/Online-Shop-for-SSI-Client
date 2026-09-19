import { useRef, useState } from "react";
import { motion as Motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDownRight } from "lucide-react";
import { useTeamHero } from "../api/hooks/teamHero.api";
import { getImageUrl } from "../utils/imageHelper";
import { staffImage } from "../utils/staffImage";

export default function TeamHero({ staff }) {
    const { data: config = {} } = useTeamHero();
    const hero = useRef(null);
    const reduced = useReducedMotion();
    const [failedImage, setFailedImage] = useState("");
    const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [0, 65]);
    const showPhoto = config.image && failedImage !== config.image;
    if (config.enabled === false) return null;
    return <section ref={hero} className={`team-hero ${showPhoto ? "team-hero--photo" : "team-hero--collage"}`} aria-label="Our team together">
        {showPhoto ? <Motion.div className="team-hero-media" style={{ y: reduced ? 0 : y }} initial={{ scale: reduced ? 1 : 1.05 }} animate={{ scale: 1 }} transition={{ duration: 1.5 }}>
            <picture>
                {config.mobileImage && <source media="(max-width: 600px)" srcSet={getImageUrl(config.mobileImage)} />}
                <img src={getImageUrl(config.image)} alt={config.alt || "The Zada Pharmacy team together"} fetchPriority="high" onError={() => setFailedImage(config.image)} style={{ "--hero-position": `${config.focusX ?? 50}% ${config.focusY ?? 50}%`, "--hero-mobile-position": `${config.mobileFocusX ?? 50}% ${config.mobileFocusY ?? 50}%` }} />
            </picture>
        </Motion.div> : <div className="team-hero-collage" aria-label="Team portrait collage">
            {staff.map((person, index) => <Motion.div key={person._id} className={`team-hero-person ${index === 0 ? "team-hero-person--owner" : ""}`} initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, delay: Math.min(index * .06, .6) }}>
                <img src={staffImage(person, 480)} loading="lazy" decoding="async" alt={person.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/assets/images/zada-logo.webp"; }} />
                <span>{person.name}<small>{person.role}</small></span>
            </Motion.div>)}
        </div>}
        <div className="team-hero-copy">
            <p className="team-eyebrow">{config.eyebrow ?? "Together, we are Zada"}</p>
            <h2>{config.heading ?? "One team.\nOne commitment to care."}</h2>
            <p className="team-hero-description">{config.description ?? "Meet the people who bring care, dedication and a personal touch to Zada Pharmacy."}</p>
            <button onClick={() => { const target = document.getElementById("team-gallery"); target?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" }); target?.focus({ preventScroll: true }); }}>{config.buttonText || "Meet our people"}<ArrowDownRight size={20} /></button>
        </div>
    </section>;
}
