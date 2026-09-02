const Mark = ({ children, ...props }) => {
    return (
        <mark className="markdown-mark" {...props}>
            {children}
        </mark>
    );
};

export default Mark;
