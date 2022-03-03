import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import { currentUser, errorHandler, NotFoundError } from '@clinic-microservices14/common'
import cookieSession from 'cookie-session';
import { reserveAppointment } from './routes/patient/reserve-appointment';
import { showAllAppointments } from './routes/patient/show-appointments';
import { showAppointment } from './routes/patient/show-appointment';
import { rescheduleAppointment } from './routes/patient/appointment-reschedule';
import { cancelledAppointment } from './routes/patient/cancel-appointment';
import { doctorApprovedAppointment } from './routes/doctor/approved';
import { doctorAddAvailableDates } from './routes/doctor/available';
import { doctorCancelledAppointment } from './routes/doctor/cancelled';
import { doctorFinishedAppointment } from './routes/doctor/finished';
import { filterAppointments } from './routes/filter';
import { showAllAppointmentsForPatients } from './routes/view-all-appointments';
import { showAllPreviousAppointments } from './routes/view-all-previous-appointments';
import { showAllUpcomingAppointments } from './routes/view-all-upcoming-appointments';
import { adminApprovedAppointment } from './routes/admin/approved';
import { adminAddAppointmentForDoctor } from './routes/admin/book';
import { adminCancelledAppointment } from './routes/admin/cancelled';
import { adminDeleteAppointments } from './routes/admin/delete';
import { adminFinishedAppointment } from './routes/admin/finished';
import { adminMissedAppointment } from './routes/admin/missed';
import { adminGetRescheduleAppointments } from './routes/admin/reschedule';
import { adminGetScheduleAppointments } from './routes/admin/schedule';
import { adminUpdateAvailableDatesForDoctors } from './routes/admin/updateAvailableDates';
import { adminUpdateBookForPatients } from './routes/admin/updateBook';
import { showaAllAvailableDates } from './routes/show-all-available-dates';

const app = express();
app.set('trust proxy', true);

app.use([
  json(),
  cookieSession({ signed : false, secure : process.env.NODE_ENV !== 'test' }),
  currentUser,
  reserveAppointment,
  showAllAppointments,
  showAppointment,
  rescheduleAppointment,
  cancelledAppointment,
  doctorAddAvailableDates,
  doctorApprovedAppointment,
  doctorCancelledAppointment,
  doctorFinishedAppointment,
  filterAppointments,
  showAllAppointmentsForPatients,
  showAllPreviousAppointments,
  showAllUpcomingAppointments,
  adminApprovedAppointment,
  adminAddAppointmentForDoctor,
  adminCancelledAppointment,
  adminDeleteAppointments,
  adminFinishedAppointment,
  adminMissedAppointment,
  adminGetRescheduleAppointments,
  adminGetScheduleAppointments,
  adminUpdateAvailableDatesForDoctors,
  adminUpdateBookForPatients,
  showaAllAvailableDates
]);

// Middlewares
app.use('*', async () => { throw new NotFoundError(); } , errorHandler);

export { app };

