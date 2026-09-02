import './SignupPrompt.scss';

function SignupPrompt({ onSignUp }) {
    return (
        <div className="form-footer">
            Don't have an account?
            <a
                href="#"
                className="footer-link"
                onClick={(e) => {
                    e.preventDefault();
                    onSignUp();
                }}
            >
                Sign Up
            </a>
        </div>
    );
}

export default SignupPrompt;
