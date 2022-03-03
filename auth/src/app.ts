import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import { currentUserRouter } from './routes/current-user';
import { signUpRouter } from './routes/signup';
import { signinRouter } from './routes/signin';
import { signOutRouter } from './routes/signOut';
import { updatedUser } from './routes/updateUser';
import { deleteUser } from './routes/deleteUser';
import { activeRouter } from './routes/active';
import { forgetPasswordRouter } from './routes/forgetPassword';
import { resetPasswordRouter } from './routes/reset-password';
import { resendTokenRouter } from './routes/resend-token';
import { checkPasswordTokenRouter } from './routes/check-password-token';
import { showAllADoctors } from './routes/doctors/show-doctors';
import { currentUser, errorHandler, NotFoundError } from '@clinic-microservices14/common';
import cookieSession from 'cookie-session';

const app = express();
app.set('trust proxy', true);
app.use([
  json(),
  cookieSession({ signed: false, secure: process.env.NODE_ENV !== 'test' }),
  signinRouter,
  signUpRouter,
  currentUserRouter,
  signOutRouter,
  currentUser,
  updatedUser,
  deleteUser,
  activeRouter,
  forgetPasswordRouter,
  resendTokenRouter,
  resetPasswordRouter,
  checkPasswordTokenRouter,
  showAllADoctors
]);

// Middlewares
app.use('*', async () => { throw new NotFoundError(); });

app.use(errorHandler);

export { app };
