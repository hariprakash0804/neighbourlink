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
});

export type AppRouter = typeof appRouter;
