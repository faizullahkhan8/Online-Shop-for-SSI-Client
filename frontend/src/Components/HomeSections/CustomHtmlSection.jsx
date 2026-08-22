const CustomHtmlSection = ({ config }) => {
    if (!config.html) return null;
    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <div dangerouslySetInnerHTML={{ __html: config.html }} />
        </section>
    );
};

export default CustomHtmlSection;
