import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
const NewsletterSection = () => <section className="max-w-[1400px] mx-auto px-4 lg:px-8 mt-12"><div className="bg-primary-pale border border-primary-light rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"><div><Mail aria-hidden="true" size={26} className="text-primary-dark mb-3" /><h3 className="text-2xl text-gray-900">Talk to our pharmacy team</h3><p className="text-sm text-gray-700 mt-2">Get help with products, delivery, and your orders.</p></div><Link to="/contact-us" className="shrink-0 rounded-xl px-5 py-3 bg-primary text-white font-semibold hover:bg-primary-dark">Contact us</Link></div></section>;
export default NewsletterSection;
