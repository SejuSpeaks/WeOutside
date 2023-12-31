import './PriceInformation.css';

const PriceInformation = ({ event }) => {
    return (
        <>
            <div className="price-information-box-event-details">

                <div className='time-box-event-details'>
                    <div>
                        <i className="fa-regular fa-clock"></i>
                    </div>



                    <div className='event-start-end-times-container'>

                        <div className='time-containers'>
                            <p>Start</p>
                            <p>{event.startDate}</p>
                            <p className='dot'>.</p>
                            <p>{event.startTime}</p>
                        </div>

                        <div className='time-containers'>
                            <p>End</p>
                            <p>{event.endDate}</p>
                            <p className='dot'>.</p>
                            <p>{event.endTime}</p>
                        </div>
                    </div>


                </div>

                <div className='price-of-event-container'>
                    <i className="fa-regular fa-money-bill-1"></i>
                    <p>{event.price === 0 ? 'FREE' : `$ ${event.price}`}</p>
                </div>

                <div className='type-of-event-container'>
                    <i className="fa-regular fa-location-dot"></i>
                    <p>{event.type}</p>
                </div>
            </div>
        </>
    )
}

export default PriceInformation;
