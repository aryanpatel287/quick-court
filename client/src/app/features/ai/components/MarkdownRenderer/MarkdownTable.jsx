const MarkdownTable = ({ children, ...props }) => {
    return (
        <div className="table-responsive">
            <table {...props}>{children}</table>
        </div>
    );
};

export default MarkdownTable;
