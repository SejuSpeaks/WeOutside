'use strict';

/** @type {import('sequelize-cli').Migration} */
const { Event } = require('../models')
const events = [
  {
    id: 1,
    groupId: 3,
    venueId: 1,
    name: 'go touch grass',
    type: 'In person',
    capacity: 40,
    price: 10.00,
    description: 'Very first outside Moment',
    startDate: '10/31/2024',
    endDate: '10/31/2024'
  },
  {
    id: 2,
    groupId: 1,
    venueId: 3,
    name: 'The Minecraft multiverse',
    type: 'Online',
    capacity: 200,
    price: 0,
    description: 'Gamer moment',
    startDate: '02/23/2024',
    endDate: '12/12/2121'
  },
  {
    id: 3,
    groupId: 2,
    venueId: 2,
    name: 'Yoga class',
    type: 'In person', //fix so people can put inperson In Person ect.
    capacity: 5,
    price: 2.00, //fix price
    description: 'not very Gamer moment',
    startDate: '12/25/2024',
    endDate: '12/25/2025'
  },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await Event.bulkCreate(events, { validate: true })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    for (let event of events) {
      try {
        await Event.destroy({
          where: {
            id: event.id
          }
        })
      } catch (error) {
        console.log(error)
      }
    }
  }
};