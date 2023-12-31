const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { Op } = require('sequelize')
const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User, Group, Membership, Event, Venue, GroupImage, sequelize } = require('../../db/models');


const ValidateGroup = [
    check('name')
        .exists({ checkFalsy: true })
        .isLength({ max: 60 })
        .withMessage('Name must be 60 characters or less'),
    check('about')
        .exists({ checkFalsy: true })
        .isLength({ min: 30 })
        .withMessage('About must be 30 characters or more'),
    check('type')
        .exists({ checkFalsy: true })
        .isIn(['Online', 'In person'])
        .withMessage('Type must be "Online" or "In person". '),
    check('private')
        .isBoolean()
        .withMessage('Private must be a boolean'),
    check('city')
        .exists({ checkFalsy: true })
        .withMessage('City is required'),
    check('state')
        .exists({ checkFalsy: true })
        .withMessage('State is required'),
    handleValidationErrors
];

const validateVenue = [ //touched
    check('address')
        .exists({ checkFalsy: true })
        .withMessage('Street address is required'),
    check('city')
        .exists({ checkFalsy: true })
        .withMessage('City is required'),
    check('state')
        .exists({ checkFalsy: true })
        .withMessage('State is required'),
    check('lat')
        .exists({ checkFalsy: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude is not valid'),
    check('lng')
        .exists({ checkFalsy: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude is not valid'),
    handleValidationErrors
];
const validateEvent = [
    check('name')
        .isLength({ min: 5 })
        .exists({ checkFalsy: true })
        .withMessage('Name must be at least 5 characters'),
    check('type')
        .isIn(['Online', 'In person'])
        .exists({ checkFalsy: true })
        .withMessage('Type must be Online or In person'),
    check('price')
        .isInt()
        .withMessage('Price is invalid'),
    check('description')
        .exists({ checkFalsy: true })
        .withMessage('Description is required'),
    check('startDate')
        .custom((value) => {
            const currentDate = new Date();
            const startDate = new Date(value);
            if (startDate < currentDate) {
                throw new Error('Start date must be in the future');
            }
            return true;
        }),
    check('endDate')
        .custom((value, { req }) => {
            const startDate = new Date(req.body.startDate)
            if (Date.parse(startDate) > Date.parse(value)) throw new Error('End date is less than Start date')
            return true
        }),
    check('previewImage')
        .exists({ checkFalsy: true })
        .withMessage("Please set an image for event"),
    handleValidationErrors
];

const validateQuery = [
    check('page')
        .isInt({ min: 1 })
        .withMessage('Page must be greater than or equal to 1'),
    check('size')
        .isInt({ min: 1 })
        .withMessage('Size must be greater than or equal to 1'),
    check('name')
        .isAlpha()
        .withMessage("Name must be a string"),
    check('type')
        .isIn(['Online', 'In person'])
        .withMessage("Type must be 'Online' or 'In Person"),
    check('startDate')
        .isDate()
        .withMessage("Start date must be a valid datetime"),
    handleValidationErrors
];


router.post('/', requireAuth, ValidateGroup, async (req, res) => {
    if (req.user) {
        const { name, about, type, private, city, state, previewImage } = req.body
        const newGroup = await Group.create({
            organizerId: req.user.id,
            name: name,
            about: about,
            type: type,
            private: private,
            city: city,
            state: state,
            previewImage: previewImage
        })
        res.status(201);
        return res.json(newGroup)
    }
})

router.get('/', async (req, res) => {
    const groups = await Group.findAll({
        include: [
            {
                model: User,
                as: 'Members',
                attributes: [],
            },
            {
                model: Event //included events
            }
        ],
        attributes: {
            include: [
                [
                    // sequelize.literal(
                    //     `(SELECT COUNT(*) FROM Memberships WHERE Memberships.groupId = \`Group\`.id)`
                    // ),
                    // "numMembers",
                    sequelize.fn('COUNT', sequelize.col('Members.id')), 'numMembers'
                ],
            ],
        },
        group: [
            'Group.id',
            'Members.Membership.id',
            'Events.id'
        ]
    });


    return res.json({
        Groups: [
            groups,
        ]
    })

})

router.get('/current', requireAuth, async (req, res) => {
    if (req.user) {
        const groups = await Group.findAll({
            where: {
                organizerId: req.user.id
            },
            include: {
                model: User,
                as: 'Members',
                attributes: []
            },
            attributes: {
                include: [
                    [sequelize.fn('COUNT', sequelize.col('Members.id')), 'numMembers'],
                ]
            },
            group: ['Members.Membership.id', 'Group.id']
        })
        return res.json({
            Groups: [
                groups
            ]
        })
    }

})

router.get('/:groupId', async (req, res) => { //fix

    const group = await Group.findOne({
        where: {
            id: req.params.groupId
        },
        include: [
            {
                model: User,
                as: 'Members',
                attributes: []
            },
            {
                model: GroupImage,
                as: "GroupImages",
            },
            {
                model: User,
                as: 'Organizer'
            },
            {
                model: Venue,
                as: 'Venues'
            },
            {
                model: Event
            }

        ],
        attributes: {
            include: [[sequelize.fn('COUNT', sequelize.col('Members.id')), 'numMembers']]
        },
        group: [
            'Members.id',
            'GroupImages.id',
            'Events.id',
            'Venues.id',
            'Group.id',
            'Organizer.id',
            'Members.Membership.id'
        ]

    })

    if (!group) {
        res.status(404)
        return res.json({
            message: "Group couldn't be found"
        })
    }

    return res.json(group)
})

router.put('/:groupId', requireAuth, ValidateGroup, async (req, res) => {
    if (req.user) {
        const group = await Group.findOne({
            where: {
                id: req.params.groupId
            }
        })

        if (!group) {
            res.status(404)
            return res.json({ message: "Group couldn't be found" })
        }

        if (group.organizerId === req.user.id) {
            const { name, about, type, private, city, state } = req.body
            console.log(private)
            group.name = name
            group.about = about
            group.type = type
            group.private = private
            group.city = city
            group.state = state

            group.save()

            return res.json(group)
        } else {
            res.status(403)
            return res.json({ message: "Forbidden" })
        }
    }
})

router.delete('/:groupId', requireAuth, async (req, res) => {
    const { groupId } = req.params
    if (req.user) {
        //find group
        const group = await Group.findByPk(groupId)
        //if group dosent exists
        if (!group) {
            res.status(404)
            return res.json({ message: "Group couldn't be found" })
        }
        //user validation
        if (group.organizerId === req.user.id) {

            await Group.destroy({ where: { id: groupId } })
            return res.json({ message: "Successfully deleted" })


        } else {
            res.status(403)
            return res.json({ message: "Forbidden" })
        }

    }
})

router.post('/:groupId/images', requireAuth, async (req, res) => {
    if (req.user) {
        const { url, preview } = req.body

        const group = await Group.findOne({
            where: {
                id: req.params.groupId
            }
        })

        if (!group) {
            res.status(404)
            return res.json({ message: "Group couldn't be found" })
        }

        if (group.organizerId === req.user.id) {

            const image = await GroupImage.build({
                groupId: req.params.groupId,
                url: url,
                preview: preview
            })
            await image.validate()
            await image.save()

            const imageWithoutDefaults = {
                id: image.id,
                url: image.url,
                preview: image.preview
            }

            return res.json(imageWithoutDefaults);
        }
        else {
            res.status(403)
            res.json({ message: 'forbidden' })
        }
    }
})

router.get('/:groupId/venues', requireAuth, async (req, res) => {
    let status;
    if (req.user) {
        const group = await Group.findOne({
            where: {
                id: req.params.groupId
            },
            include: {
                model: User,
                as: 'Members',
                attributes: ['username'],
                through: {
                    attributes: ['status']
                }
            }

        });

        if (!group) {
            res.status(404)
            res.json({ message: "Group could't be found" })
        }

        const membershipStatusOfUser = await Membership.findOne({
            where: { userId: req.user.id, groupId: req.params.groupId }
        })

        if (membershipStatusOfUser) status = membershipStatusOfUser.status


        if (group.organizerId === req.user.id || status === 'host' || status === 'co-host') {
            const venues = await group.getVenues()
            res.json({
                Venues: [
                    venues
                ]
            })
        } else {
            res.status(403)
            res.json({ message: "Forbidden" })
        }
    }
})

router.get('/:groupId/events', async (req, res) => {
    const events = await Event.findAll({
        where: {
            groupId: req.params.groupId
        },
        include: [
            {
                model: Group,
                attributes: ['id', 'name', 'city', 'state'],

            },
            {
                model: Venue,
                attributes: ['id', 'city', 'state']
            },
            {
                model: User,
                as: 'attendee',
                attributes: []
            }
        ],
        attributes: {
            exclude: ['capacity', 'createdAt', 'updatedAt'],
            include: [[sequelize.fn('COUNT', sequelize.col('attendee.id')), 'numAttending']]
        },
        group: [
            'Event.id',
            'Venue.id',
            'Group.id',
            'attendee.Attendee.id'
        ]
    })


    if (!events.length) {
        res.status(404)
        res.json({ message: "Group couldn't be found" })
    }

    res.json({
        Events: [
            events
        ]
    })
})

router.post('/:groupId/venues', requireAuth, validateVenue, async (req, res) => {
    let status;
    const { user } = req;
    const { address, city, state, lat, lng } = req.body
    if (user) {
        const group = await Group.findOne({
            where: {
                id: req.params.groupId
            },
            include: {
                model: User,
                as: 'Members',
                attributes: ['username'],
                through: {
                    attributes: ['status']
                }
            }

        });
        //group couldnt be found
        if (!group) {
            res.status(404)
            res.json({ message: "Group could't be found" })
        }

        //fnd membership of user
        const membershipStatusOfUser = await Membership.findOne({
            where: { userId: req.user.id, groupId: req.params.groupId }
        })

        if (membershipStatusOfUser) status = membershipStatusOfUser.status

        //find if user if organizer or co-host of group
        if (group.organizerId === user.id || status === 'co-host') {
            const venue = await Venue.create({
                groupId: req.params.groupId,
                address,
                city,
                state,
                lat,
                lng
            })

            res.json(venue)
        } else {
            res.status(403)
            res.json({ message: "Forbidden" })
        }
    }
})

router.post('/:groupId/events', requireAuth, validateEvent, async (req, res) => { //fix
    let status;
    const { user } = req
    const { name, type, capacity, price, description, startDate, startTime, endTime, previewImage, endDate } = req.body
    const group = await Group.findByPk(req.params.groupId, { include: [{ model: User, as: 'Members' }, { model: Venue, as: 'Venues', attributes: ['id'] }] });
    //group couldnt be found
    if (!group) {
        res.status(404)
        res.json({ message: "Group couldn't be found" })
    }

    // const venueId = group.Venues[0].id

    //find membership status of user
    const membershipStatusOfUser = await Membership.findOne({
        where: { userId: req.user.id, groupId: req.params.groupId }
    })

    if (membershipStatusOfUser) status = membershipStatusOfUser.status

    if (user) {
        if (group.organizerId === user.id || status === 'co-host') {
            const event = Event.build({
                groupId: group.id,
                // venueId: venueId,
                name: name,
                type: type,
                price: price,
                description: description,
                host: user.id,
                startDate: startDate,
                startTime: startTime,
                endTime: endTime,
                endDate: endDate,
                previewImage: previewImage,
            })

            await event.validate()

            await event.save()

            res.json(event)
        } else {
            res.status(403)
            res.json({ message: "Forbidden" })
        }
    }
})

router.get('/:groupId/members', async (req, res) => {
    let organizerId;
    let status;
    const { user } = req

    const group = await Group.findOne({
        where: {
            id: req.params.groupId
        },
        include: {
            model: User,
            as: 'Members',
            attributes: ['id', 'firstName', 'lastName'],
            through: {
                attributes: ['status']
            }
        },
        attributes: ['organizerId']

    })
    if (!group) {
        res.status(404)
        res.json({ message: "Group couldn't be found" })
    }
    organizerId = group.organizerId
    const membershipStatusOfUser = await Membership.findOne({
        where: { userId: req.user.id, groupId: req.params.groupId }
    })

    if (membershipStatusOfUser) status = membershipStatusOfUser.status

    if (user.id === organizerId || status === 'co-host') {
        const organizerGroup = await Group.findOne({
            where: {
                id: req.params.groupId
            },
            include: {
                model: User,
                as: 'Members',
                attributes: ['id', 'firstName', 'lastName'],
                through: {
                    attributes: ['status']
                }
            },
            attributes: []

        })

        res.json(organizerGroup)
    }
    else {
        const nonOrganizerGroup = await Group.findOne({
            where: {
                id: req.params.groupId
            },
            include: {
                model: User,
                as: 'Members',
                attributes: ['id', 'firstName', 'lastName'],
                through: {
                    attributes: ['status'],
                    where: {
                        status: {
                            [Op.ne]: 'pending'
                        }
                    }
                },
            },
            attributes: []
        })

        res.json(nonOrganizerGroup)
    }
})

router.post('/:groupId/membership', requireAuth, async (req, res) => {
    let status;
    if (req.user) {
        const group = await Group.findByPk(req.params.groupId)

        const membershipStatus = await Membership.findOne({
            where: {
                groupId: req.params.groupId,
                userId: req.user.id
            }
        })
        //group dosent exist
        if (!group) {
            res.status(404)
            res.json({ message: "Group couldn't be found" })
            return
        }
        //if user has requested or is a member of the group
        if (membershipStatus) {
            status = membershipStatus.status

            if (status === 'pending') {
                res.status(400)
                res.json({ message: "Membership has already been requested" })
                return
            }

            if (status === 'member' || status === 'host' || status === 'co-host') {
                res.status(400)
                res.json({ message: "User is already a member of the group" })
                return
            }
        }



        const membershipRequest = await Membership.create({
            userId: req.user.id,
            groupId: req.params.groupId
        })

        const safeMember = {
            memberId: req.user.id,
            status: membershipRequest.status
        }

        return res.json(safeMember)
    }
})

router.put('/:groupId/membership', requireAuth, async (req, res) => {
    const { status, memberId } = req.body
    if (req.user) {

        const group = await Group.findOne({
            where: {
                id: req.params.groupId
            },
            include: {
                model: User,
                as: 'Members'
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        })

        const membership = await Membership.findOne({
            where: {
                userId: memberId,
                groupId: req.params.groupId
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        })

        //couldnt find group
        if (!group) {
            res.status(400)
            res.json({
                "message": "Group couldn't be found"
            })
        }

        //couldnt find user
        const user = await User.findByPk(memberId)
        if (!user) {
            res.status(400)
            res.json({
                "message": "Validation Error",
                "errors": {
                    "memberId": "User couldn't be found"
                }
            })
        }

        //membership dosent exist
        if (!membership) {
            res.status(400)
            res.json({
                "message": "Membership between the user and the group does not exist"
            })
        }

        const currentstatus = membership.status
        const organizerId = group.organizerId

        //changin status of member to pending
        if (status === 'pending') {
            res.status(400)
            res.json({
                "message": "Validations Error",
                "errors": {
                    "status": "Cannot change a membership status to pending"
                }
            })
        }

        //changing status of user to member
        if (status === 'member') {
            if (req.user.id === group.organizerId || currentstatus === 'co-host') {
                membership.status = 'member'
                membership.save()

                const safeMember = {
                    id: membership.id,
                    groupId: req.params.groupId,
                    memberId: memberId,
                    status: membership.status
                }

                res.json(safeMember)
                return
            } else {
                res.status(403)
                res.json({ message: 'Forbidden' })
            }
        }

        //changing status of user to co-host
        if (status === 'co-host') {
            if (req.user.id === organizerId) {
                membership.status = 'co-host'
                membership.save()

                const safeMember = {
                    id: membership.id,
                    groupId: req.params.groupId,
                    memberId: memberId,
                    status: membership.status
                }

                res.json(safeMember)
                return
            }
            else {
                res.status(403)
                res.json({ message: "Forbidden" })
            }
        }

    }
})

router.delete('/:groupId/membership', requireAuth, async (req, res) => {
    const { memberId } = req.body
    if (req.user) {
        const group = await Group.findOne({
            where: {
                id: req.params.groupId
            }
        })
        //check if group exists
        if (!group) {
            res.status(404)
            res.json({
                "message": "Group couldn't be found"
            })
        }

        //check if user exists
        const requestedUserToDelete = await User.findByPk(memberId)
        if (!requestedUserToDelete) {
            res.status(400)
            res.json({
                "message": "Validation Error",
                "errors": {
                    "memberId": "User couldn't be found"
                }
            })
        }
        //check if user is organizer of group
        const organizerId = group.organizerId
        //check if user is deleting themselves
        // console.log(req.user.id, 'userId', userId)
        if (req.user.id === memberId || req.user.id === organizerId) {
            //check if the membership exists
            const requestedUserMembership = await Membership.findOne({
                where: {
                    groupId: req.params.groupId,
                    userId: memberId
                }
            })
            if (!requestedUserMembership) {
                res.status(404)
                res.json({ message: "Membership does not exists for this User" })
            }
            //destory membership
            await Membership.destroy({
                where: {
                    groupId: req.params.groupId,
                    userId: memberId
                }
            })

            res.json({ message: "Successfully deleted membership from group" })
        } else {
            res.status(403)
            res.json({ message: "Forbidden" })
        }
    }
})


// module.exports = router

module.exports = router
