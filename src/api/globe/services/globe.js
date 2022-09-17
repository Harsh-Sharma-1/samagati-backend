'use strict';

/**
 * globe service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::globe.globe');
