import { safeHtml } from "../../utils/safeHtml";
const CustomHtmlSection = ({ config }) => {
    if (!config.html) return null;
    return (
        <section className="site-shell mt-14">
            <div dangerouslySetInnerHTML={{ __html: safeHtml(config.html) }} />
        </section>
    );
};

export default CustomHtmlSection;
