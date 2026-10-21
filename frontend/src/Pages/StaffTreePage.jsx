import { PageLoading } from "../Components/UI/PageLoading";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Circle, Orbit, Pause, Play, X } from "lucide-react";
import { useGetStaff } from "../api/hooks/staff.api";
import LoadingSpinner from "../Components/LoadingSpinner";
import { staffImage } from "../utils/staffImage";
import { createTeamAnimation } from "../utils/teamAnimation";
import "./StaffTreePage.css";
import TeamHero from "../Components/TeamHero";

const fallback = "/assets/images/zada-logo.webp";
const portrait = staffImage;
const imageError = (event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallback; };

function Profile({ member, close }) {
    const dialog = useRef(null);
    const description = useMemo(() => {
        const doc = new DOMParser().parseFromString(member.description || "", "text/html");
        doc.querySelectorAll("script,style").forEach((node) => node.remove());
        doc.querySelectorAll("p,br,li").forEach((node) => node.append("\n"));
        return doc.body.textContent.trim();
    }, [member.description]);
    useEffect(() => {
        const previous = document.activeElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialog.current.showModal();
        return () => {
            document.body.style.overflow = overflow;
            previous?.focus();
        };
    }, []);
    return createPortal(
        <dialog ref={dialog} className="team-dialog" aria-labelledby="team-profile-name" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
            <Motion.article className="team-profile" initial={{ opacity: 0, y: 30, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .35 }}>
                <button className="team-close" onClick={close} aria-label="Close profile"><X size={22} /></button>
                <div className="team-profile-photo"><img src={portrait(member, 1000)} alt={member.name} decoding="async" onError={imageError} /></div>
                <div className="team-profile-copy">
                    <span className="team-eyebrow">Meet the team</span>
                    <p className="team-profile-role">{member.role}</p>
                    <h2 id="team-profile-name">{member.name}</h2>
                    {description && <p className="team-biography">{description}</p>}
                    <button className="team-return" onClick={close}>Back to the team <ArrowUpRight size={18} /></button>
                </div>
            </Motion.article>
        </dialog>, document.body,
    );
}

function TeamScene({ owner, members, mode, paused, reduced, select }) {
    const stage = useRef(null);
    const cards = useRef([]);
    const ceo = useRef(null);
    const animation = useRef(null);
    useEffect(() => {
        const controller = createTeamAnimation({ stage: stage.current, cards: cards.current, ceo: ceo.current });
        animation.current = controller;
        return () => controller.destroy();
    }, [members]);
    useEffect(() => { animation.current?.update({ mode, paused, reduced }); }, [mode, paused, reduced, members]);

    return <div ref={stage} className={`team-stage team-stage--${mode}`} aria-label={`${mode} team gallery`}>
        <div className="team-orbit-line team-orbit-line--one" aria-hidden="true" />
        <div className="team-orbit-line team-orbit-line--two" aria-hidden="true" />
        <span className="team-scene-word" aria-hidden="true">Together.</span>
        <button ref={ceo} className="team-ceo" onClick={() => select(owner)} aria-label={`View ${owner.name}, ${owner.role}`}>
            <img src={portrait(owner, 480)} loading="lazy" decoding="async" alt={owner.name} onError={imageError} />
            <span className="team-ceo-label"><small>{owner.role}</small><strong>{owner.name}</strong><ArrowUpRight size={16} /></span>
        </button>
        {members.map((member, index) => <button key={member._id} ref={(node) => { cards.current[index] = node; }} className="team-orbit-card" onClick={() => select(member)} aria-label={`View ${member.name}, ${member.role}`}>
            <img src={portrait(member, 320)} loading="lazy" decoding="async" alt={member.name} onError={imageError} />
            <span className="team-card-caption">{member.name}</span>
        </button>)}
    </div>;
}

export default function StaffTreePage() {
    const { data: staff, loading } = useGetStaff();
    const [mode, setMode] = useState("ring");
    const [paused, setPaused] = useState(false);
    const [selected, setSelected] = useState(null);
    const reduceMotion = useReducedMotion();
    const { owner, members } = useMemo(() => {
        const list = Array.isArray(staff) ? staff : [];
        const leader = list.find((member) => /\bceo\b|chief executive/i.test(member.role)) || list.find((member) => !member.parentId) || list[0];
        return { owner: leader, members: list.filter((member) => member._id !== leader?._id) };
    }, [staff]);
    if (loading) return <PageLoading variant="team" />;
    if (!owner) return <section className="team-empty"><h1>Meet our team</h1><p>Team profiles will appear here when they are available.</p></section>;
    return <section className="team-page">
        <div className="site-shell">
            <TeamHero staff={[owner, ...members]} />
            <header id="team-gallery" tabIndex={-1} className="team-heading">
                <div><p className="team-eyebrow">The people behind Zada</p><h1>Care begins<br />with <em>people.</em></h1></div>
                <p className="team-intro">One team. A shared commitment to care.<br />Explore the people at the heart of Zada.</p>
            </header>
            <div className="team-toolbar">
                <div className="team-mode-switch" role="group" aria-label="Gallery layout">
                    <button aria-pressed={mode === "ring"} onClick={() => setMode("ring")}><Circle size={16} /> Ring</button>
                    <button aria-pressed={mode === "spiral"} onClick={() => setMode("spiral")}><Orbit size={17} /> Spiral</button>
                </div>
                <button className="team-pause" onClick={() => setPaused((value) => !value)} disabled={!!reduceMotion} aria-label={paused ? "Resume animation" : "Pause animation"}>
                    {paused || reduceMotion ? <Play size={15} /> : <Pause size={15} />} {reduceMotion ? "Reduced motion" : paused ? "Resume" : "Pause"}
                </button>
            </div>
            <TeamScene owner={owner} members={members} mode={mode} paused={paused || !!selected} reduced={!!reduceMotion} select={setSelected} />
            <div className="team-caption"><span>{String(members.length + 1).padStart(2, "0")} people · One shared purpose</span><span>Select a portrait to meet the person <ArrowUpRight size={14} /></span></div>
            <nav className="team-directory" aria-label="Team members">{[owner, ...members].map((member) => <button key={member._id} onClick={() => setSelected(member)}><span>{member.name}</span><small>{member.role}</small><ArrowUpRight size={16} /></button>)}</nav>
        </div>
        <AnimatePresence>{selected && <Profile key={selected._id} member={selected} close={() => setSelected(null)} />}</AnimatePresence>
    </section>;
}
