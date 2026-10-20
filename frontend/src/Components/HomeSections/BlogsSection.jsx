import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";
const validLink = value => typeof value === "string" && ((value.startsWith("/") && !value.startsWith("//")) || value.startsWith("https://"));
const BlogsSection = ({ config = {} }) => {
    const blogs = (config.blogs || []).filter(blog => validLink(blog.link || blog.url));
    if (!blogs.length) return null;
    return <section className="max-w-[1400px] mx-auto px-4 lg:px-8 mt-12"><SectionHeader title={config.title || "From our pharmacy"} subtitle={config.subtitle} /><div className="grid grid-cols-1 md:grid-cols-3 gap-5">{blogs.map((blog,index) => <article key={index} className="bg-white border border-gray-200 rounded-2xl p-6"><p className="text-sm text-primary-dark mb-3">{blog.category}</p><h3 className="text-lg mb-3">{blog.title}</h3>{blog.author && <p className="text-sm text-gray-600 mb-4">By {blog.author}</p>}<Link className="inline-flex py-2 text-sm font-semibold text-primary-dark underline underline-offset-4" to={blog.link || blog.url}>Read article</Link></article>)}</div></section>;
};
export default BlogsSection;
