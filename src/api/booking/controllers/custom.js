const { createCoreController } = require("@strapi/strapi").factories;
const stripe = require("stripe")(process.env.STRIPE_SK);
const { utils } = require("@strapi/strapi");

const fromDecimalToInt = (number) => parseInt(number * 100);

module.exports = createCoreController("api::booking.booking", ({ strapi }) => ({
  // Method 1: Creating an entirely custom action
  async create(ctx) {
    const { tour, user } = ctx.request.body;
    if (!tour) {
      return ctx.throw(400, "Please specify a tour");
    }

    const realTour = await strapi.service("api::tour.tour").findOne(tour.id);

    if (!realTour) {
      return ctx.throw(404, "No tour with such id");
    }

    const BASE_URL = ctx.request.headers.origin || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user.email,
      mode: "payment",
      success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: BASE_URL,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: realTour.Name,
            },
            unit_amount: fromDecimalToInt(realTour.price),
          },
          quantity: 1,
        },
      ],
    });

    //Create the order
    const newOrder = await strapi.service("api::booking.booking").create({
      data: {
        name: user.name,
        email: user.email,
        contact: user.contact,
        learning: user.learning,
        tourid: realTour.id,
        tourname: realTour.Name,
        price: realTour.price,
        status: "unpaid",
        checkout_session: session.id,
      },
    });

    return { id: session.id };
  },

  async confirm(ctx) {
    const { checkout_session } = ctx.request.body;

    const session = await stripe.checkout.sessions.retrieve(checkout_session);

    console.log(session);

    if (session.payment_status === "paid") {
      const booking = await strapi.db.query("api::booking.booking").findMany({
        where: {
          checkout_session,
        },
      });

      console.log("data", booking);

      const updateOrder = await strapi
        .service("api::booking.booking")
        .update(booking[0].id, {
          data: {
            status: "paid",
          },
        });

      return updateOrder;
    } else {
      ctx.throw(400, "the payment wasn't successfull, please call support");
    }
  },
}));
