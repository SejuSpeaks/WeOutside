import { useEffect, useState } from 'react'
import { setUserThunk } from '../../store/session';
import { useDispatch } from 'react-redux';
import { useHistory, Redirect, NavLink } from 'react-router-dom/cjs/react-router-dom.min';
import { useSelector } from 'react-redux'
import { useModal } from '../../context/Modal';

import './LoginForm.css'

const LoginFormModal = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const [credential, setCredential] = useState("");
    const [password, setPassword] = useState("");
    const [disableButton, setDisableButton] = useState(false)
    const [errors, setErrors] = useState({})
    const { closeModal } = useModal()


    const userState = useSelector(state => state.session);

    /*disable login button if username length < 4 || password < 6

        state tracks button disable
        useEffect checks whenever password or username changes
        conditionals for both
        set button to the state
    */

    useEffect(() => {
        if (credential.length >= 4 && password.length >= 6) {
            setDisableButton(false);
        } else {
            setDisableButton(true);
        }


    }, [credential, password])



    const Submit = (e) => {
        e.preventDefault()

        const user = {
            credential: credential,
            password: password
        }

        return dispatch(setUserThunk(user)).then(closeModal)
            .catch(
                async (res) => {
                    const data = await res.json();
                    if (data && data.errors) setErrors(data.errors);
                })

    }

    const logInAsDemo = () => {

        const user = {
            credential: "demo10",
            password: "1234"
        }

        return dispatch(setUserThunk(user)).then(closeModal)
            .catch(
                async (res) => {
                    const data = await res.json();
                    if (data && data.errors) setErrors(data.errors);
                })
    }

    return (
        <div className='login-container'>
            <div className='login-box'>
                <img className='login-page-logo' src='https://cdn.icon-icons.com/icons2/2108/PNG/512/meetup_icon_130877.png' />
                <h2>Log In</h2>
                <form onSubmit={(e) => Submit(e)}>
                    <div className='input-container'>
                        <label htmlFor='username-email'>Username/Email: </label>
                        <input className='text-box-login' type='text' name='username-email' value={credential} onChange={(e) => setCredential(e.target.value)}></input>
                    </div>
                    <div className='input-container'>
                        <label htmlFor='password'>Password: </label>
                        <input className='text-box-login' type='password' name='password' value={password} onChange={(e) => setPassword(e.target.value)}></input>
                    </div>
                    {errors.credential && <p>{errors.credential}</p>}
                    <button disabled={disableButton} className='login-button' type='submit'>Log In</button>
                    <div className='login-as-demo-button-container'>
                        <button id='login-as-demo-button' onClick={logInAsDemo}>Log in as Demo User </button>
                    </div>
                </form>


            </div>
        </div>
    )
}

export default LoginFormModal;
