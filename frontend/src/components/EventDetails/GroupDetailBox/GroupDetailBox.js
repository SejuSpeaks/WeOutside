import { useSelector, useDispatch } from "react-redux";
import { getAllGroups } from "../../../store/groups";
import { useEffect, useState } from "react";

import './GroupDetailBox.css'

const GroupDetailsBox = ({ event }) => {
    const dispatch = useDispatch();
    const [isLoaded, setIsLoaded] = useState(false)
    const groupOfEvent = event.Group

    // useEffect(() => {
    //     dispatch(getAllGroups())
    //         .then(() => setIsLoaded(true))
    // }, [dispatch])


    return (
        <div className="group-container-event-detail-page">

            <div className="image-container-event-detail-page">
                <img className="image-group-box-event-detail" src={groupOfEvent.previewImage} />
            </div>

            <div className="group-description-event-detail-page">
                <h1>{groupOfEvent.name}</h1>
                <p>{groupOfEvent.private ? "Private" : "Public"}</p>
            </div>

        </div>
        // <h1>group</h1>
    )
    // <h1>uhh</h1>
}

export default GroupDetailsBox;
