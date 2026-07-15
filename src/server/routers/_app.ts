import { router } from "../trpc";
import { authRouter } from "./auth";
import { locationRouter } from "./location";
import { directoryRouter } from "./directory";
import { vendorRouter } from "./vendor";
import { bookingRouter } from "./booking";
import { reviewRouter } from "./review";
import { reportRouter } from "./report";
import { adminRouter } from "./admin";
import { chatRouter } from "./chat";
import { civicRouter } from "./civic";
import { bulletinRouter } from "./bulletin";
import { eventsRouter } from "./events";
import { sosRouter } from "./sos";
import { favoritesRouter } from "./favorites";
import { notificationsRouter } from "./notifications";
import { dealsRouter } from "./deals";

export const appRouter = router({
  auth: authRouter,
  location: locationRouter,
  directory: directoryRouter,
  vendor: vendorRouter,
  booking: bookingRouter,
  review: reviewRouter,
  report: reportRouter,
  admin: adminRouter,
  chat: chatRouter,
  civic: civicRouter,
  bulletin: bulletinRouter,
  events: eventsRouter,
  sos: sosRouter,
  favorites: favoritesRouter,
  notifications: notificationsRouter,
  deals: dealsRouter,
});

export type AppRouter = typeof appRouter;
