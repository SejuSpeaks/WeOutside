import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, Redirect } from 'react-router-dom/cjs/react-router-dom.min';
import { signUp } from '../../store/session';
import { useModal } from '../../context/Modal'

import './SignupFormPage.css'

const SignUp = () => {
    const dispatch = useDispatch();
    const history = useHistory();

    const sessionUser = useSelector(state => state.session.user);
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [disableButton, setDisableButton] = useState(true);
    const [errors, setErrors] = useState({})
    const { closeModal } = useModal();



    useEffect(() => {
        if (!username.length || !firstName.length || !lastName.length || !email.length || !password.length || !confirmPassword.length || password.length < 6 || username.length < 4) {
            setDisableButton(true)
        }
        else {
            setDisableButton(false)
        }
    }, [username, firstName, lastName, email, password, confirmPassword])

    const buttonClassName = "signup-button" + (disableButton ? "disable" : "")

    if (sessionUser) return <Redirect to='/' />

    const submit = (e) => {
        e.preventDefault();

        const user = {
            username,
            firstName,
            lastName,
            email,
            password
        }
        if (password === confirmPassword) {
            setErrors({});
            return dispatch(signUp(user)).then(closeModal)
                .catch(async res => {
                    const data = await res.json();
                    console.log('this is error data', data);
                    if (data && data.errors) {
                        setErrors((prevErrors) => ({ ...prevErrors, ...data.errors }));
                    }
                    else {
                        setErrors({})
                    }
                })
        }
        return setErrors({ confirmPassword: 'Confirmed Password field must be the same as the Password field' })

    }

    console.log(errors)

    return (
        <div className='signup-page'>
            <div className='signup-form-container'>
                <h2 id='join-us-header'>Join us Outside</h2>
                <form className='signup-form' onSubmit={(e) => submit(e)}>
                    <div className='signup-textbox-container'>
                        <label htmlFor='username'>Username</label>
                        <input className='signup-textbox' name='username' type='text' value={username} onChange={(e) => setUsername(e.target.value)}></input>
                        {errors.username && <p>{errors.username}</p>}
                    </div>
                    <div className='signup-textbox-container'>
                        <label htmlFor='firstname'>FirstName</label>
                        <input className='signup-textbox' name='firstname' type='text' value={firstName} onChange={(e) => setFirstName(e.target.value)}></input>
                        {errors.firstName && <p>{errors.firstName}</p>}
                    </div>
                    <div className='signup-textbox-container'>
                        <label htmlFor='lastName'>LastName</label>
                        <input className='signup-textbox' name='lastName' type='text' value={lastName} onChange={(e) => setLastName(e.target.value)}></input>
                        {errors.lastName && <p>{errors.lastName}</p>}
                    </div>
                    <div className='signup-textbox-container'>
                        <label htmlFor='email'>Email</label>
                        <input className='signup-textbox' placeholder='example@gmail.com' name='email' type='text' value={email} onChange={(e) => setEmail(e.target.value)}></input>
                        {errors.email && <p>{errors.email}</p>}
                    </div>
                    <div className='signup-textbox-container'>
                        <label htmlFor='password'>Password </label>
                        <input className='signup-textbox' name='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)}></input>
                        {errors.password && <p>{errors.password}</p>}
                    </div>

                    <div className='signup-textbox-container'>
                        <label htmlFor='confirm-pass'>
                            Confirm Password
                        </label>
                        <input
                            name='confirm-pass'
                            className='signup-textbox'
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {errors.confirmPassword && <p>{errors.confirmPassword}</p>}
                    </div>

                    <button disabled={disableButton} className={buttonClassName} type='submit'>SignUp</button>
                </form>
            </div>
        </div>
    )
}

export default SignUp;
