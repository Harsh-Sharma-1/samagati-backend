'use strict';

/**
 * previous-tour service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::previous-tour.previous-tour');
