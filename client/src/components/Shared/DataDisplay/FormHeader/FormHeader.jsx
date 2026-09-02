import './FormHeader.scss';

function FormHeader({ title, subtitle }) {
    return (
        <div className="form-header">
            <h2 className="form-title">{title}</h2>
            <p className="form-subtitle">{subtitle}</p>
        </div>
    );
}

export default FormHeader;
