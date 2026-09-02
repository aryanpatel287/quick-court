import './SigninPrompt.scss';

function SigninPrompt({ onSignIn }) {
    return (
        <div className="form-footer">
            Already have an account?
            <a
                href="#"
                className="footer-link"
                onClick={(e) => {
                    e.preventDefault();
                    onSignIn();
                }}
            >
                Sign In
            </a>
        </div>
    );
}

export default SigninPrompt;
