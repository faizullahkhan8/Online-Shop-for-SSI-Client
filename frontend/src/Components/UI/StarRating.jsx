import { Star, StarHalf } from "lucide-react";

const StarRating = ({ rating = 0, setRating, readonly = false, size = 18, activeColor = "text-yellow-400", inactiveColor = "text-slate-300" }) => {
    const star = index => rating >= index ? <Star size={size} fill="currentColor" className={activeColor} /> : rating >= index - .5 ? <StarHalf size={size} fill="currentColor" className={activeColor} /> : <Star size={size} className={inactiveColor} />;
    if (readonly) return <div role="img" aria-label={rating > 0 ? `${rating} out of 5 stars` : "No ratings yet"} className="flex items-center gap-1">{[1,2,3,4,5].map(index => <span aria-hidden="true" key={index}>{star(index)}</span>)}</div>;
    return <div role="radiogroup" aria-label="Product rating" className="flex items-center gap-1">{[1,2,3,4,5].map(index => <button key={index} type="button" role="radio" aria-label={`${index} ${index === 1 ? "star" : "stars"}`} aria-checked={rating === index} tabIndex={rating === index || (!rating && index === 1) ? 0 : -1} data-rating={index} onClick={() => setRating?.(index)} onKeyDown={event => {
        const next = event.key === "Home" ? 1 : event.key === "End" ? 5 : ["ArrowRight", "ArrowUp"].includes(event.key) ? (index % 5) + 1 : ["ArrowLeft", "ArrowDown"].includes(event.key) ? ((index + 3) % 5) + 1 : null;
        if (next) { event.preventDefault(); setRating?.(next); event.currentTarget.parentElement.querySelector(`[data-rating="${next}"]`)?.focus(); }
    }} className="h-11 w-11 grid place-items-center rounded-lg hover:bg-primary-pale">{star(index)}</button>)}</div>;
};
export default StarRating;
