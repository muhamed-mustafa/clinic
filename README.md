# Clinic

An event-driven clinic appointment backend built as three TypeScript microservices on Kubernetes, with SMS reminders scheduled through a delayed job queue.

Patients book appointments with doctors, doctors publish their available time slots and approve or close appointments, and admins manage the whole schedule. The services communicate only through NATS Streaming events, each HTTP service owns its own MongoDB database, and an approved appointment schedules a Twilio SMS reminder for the day before the visit. The project demonstrates role-based workflows across services, asynchronous data replication with optimistic concurrency control, and delayed background jobs with Bull and Redis.

The event-bus infrastructure (base publisher/listener classes, the NATS wrapper, the shared `common` package and the Skaffold setup) follows the pattern taught in Stephen Grider's "Microservices with Node JS and React" course; the clinic domain, its services and workflows are my own.

## Services

| Service | Responsibility | Datastore | Main dependencies |
| --- | --- | --- | --- |
| `auth` | Sign-up with e-mail activation for patients, doctors and admins, sign-in, password reset, profile and picture upload, doctor directory | MongoDB (`auth-mongo-srv`) | express, mongoose, jsonwebtoken, cookie-session, nodemailer, cloudinary |
| `appointment` | Doctor availability slots, patient booking and reschedule requests, status transitions by doctors and admins, schedule views and filters; replica of users | MongoDB (`appointment-mongo-srv`) | express, mongoose, lodash |
| `notification` | Schedules and sends SMS appointment reminders; no HTTP API | Redis (`notification-redis-srv`) | bull, twilio, node-nats-streaming |
| `common` | Shared library (`@clinic-microservices14/common`): errors, middlewares, enums, event contracts | n/a | express-validator, jsonwebtoken, multer, node-nats-streaming |

## Architecture

### Event bus

Services do not call each other over HTTP. They exchange events through NATS Streaming (`nats-streaming:0.17.0`, cluster id `clinic`). The `common` package provides abstract `Publisher` and `Listener` classes typed by an event interface, so each subject and its payload are checked at compile time. Listeners use one queue group per service, durable subscriptions and manual acknowledgement with a 5 second ack wait, so an event that fails processing is redelivered.

| Subject | Published by | Consumed by | Effect |
| --- | --- | --- | --- |
| `user:created` | auth (sign-up) | appointment | Creates the local user replica (role, phone, specialization) |
| `user:updated` | auth (activation, profile update, password reset, new availability slot) | appointment | Updates the replica |
| `user:deleted` | auth (account deletion) | appointment | Consumed by the appointment service's user-deleted listener |
| `appointment:created` | appointment (doctor adds an availability slot; doctor or admin approves an appointment) | auth, notification | auth appends the slot to the doctor's `availableDates`; notification schedules the SMS reminder |

### Concurrency and versioning

User documents carry a `version` field (`mongoose-update-if-current`, `versionKey` set to `version`). `user:updated` events include the new version, and the appointment service looks up its replica at `version - 1` before applying the change. An out-of-order event does not match, is not acknowledged, and is redelivered after the ack wait.

### Delayed SMS reminders

When an appointment is approved, the appointment service publishes `appointment:created` with the patient's id and phone number and the appointment date and start time. The notification service computes the delay until 24 hours before the appointment and, if that moment is still in the future, adds a delayed job to a Bull queue backed by Redis. When the job fires, the worker sends the reminder SMS through the Twilio API.

### Shared library

`common/` is the source of the `@clinic-microservices14/common` npm package that every service installs. It contains custom error classes with a common serialization format, the `currentUser`, `requireAuth`, `errorHandler`, upload (multer, in-memory, image validation) and sign-up validation middlewares, the `RolesType`, `StatusType` and `GenderType` enums, the `Subjects` enum and one typed interface per event.

### Authentication and roles

The auth service signs a JWT (`id`, `email`) and stores it in a cookie session; the appointment service verifies the same cookie with the shared `JWT_KEY`. Roles (`admin`, `doctor`, `patient`) are not part of the token: each appointment route loads the caller from its local user replica and checks the role there. Cookies are marked `secure`, so requests must be made over HTTPS.

### Ingress routing

An ingress-nginx resource for host `clinic.dev` routes by path prefix:

| Path | Service |
| --- | --- |
| `/api/auth/?(.*)` | `auth-srv:3000` |
| `/api/appointment/?(.*)` | `appointment-srv:3000` |

## Tech Stack

- Language and runtime: TypeScript, Node.js (run with `ts-node-dev`)
- HTTP: Express, express-async-errors, cookie-session, multer
- Data: MongoDB with Mongoose (one database per HTTP service), Redis
- Messaging and jobs: NATS Streaming (`node-nats-streaming`), Bull
- Integrations: Twilio (SMS), Nodemailer over Gmail SMTP, Cloudinary
- Infrastructure: Docker, Kubernetes, ingress-nginx, Skaffold

## Getting Started

### Prerequisites

- Docker
- A local Kubernetes cluster (Docker Desktop or Minikube)
- [Skaffold](https://skaffold.dev/)
- [ingress-nginx](https://kubernetes.github.io/ingress-nginx/deploy/) installed in the cluster
- Twilio, Cloudinary and Gmail credentials

### 1. Map the development host

Add the cluster IP to your hosts file (`127.0.0.1` on Docker Desktop, `minikube ip` on Minikube):

```
127.0.0.1 clinic.dev
```

### 2. Create the secrets

```bash
kubectl create secret generic jwt-secret --from-literal=JWT_KEY=<value>
kubectl create secret generic cloudinary-secret --from-literal=CLOUDINARY_SECRET_KEY=<value>
kubectl create secret generic mail-api-secret-pass --from-literal=MAIL_PASS=<value>
kubectl create secret generic twilio-auth-token --from-literal=TWILIO_AUTH_TOKEN=<value>
```

### 3. Set your own account values

`CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `MAIL_USER`, `TWILIO_ACCOUNT_SID` and `TWILIO_PHONE_NUMBER` are plain `env` values in the deployment manifests under `infra/k8s/`. Replace them with your own before deploying.

### 4. Run

```bash
skaffold dev
```

Skaffold builds one image per service, applies the manifests in `infra/k8s/` and syncs changed `src/**/*.ts` files into the running containers. The API is then available at `https://clinic.dev/api/...`.

## Environment Variables / Secrets

| Name | Used by | Source | Meaning |
| --- | --- | --- | --- |
| `JWT_KEY` | auth, appointment | secret `jwt-secret` | Signing key for the session JWT |
| `CLOUDINARY_SECRET_KEY` | auth | secret `cloudinary-secret` | Cloudinary API secret |
| `MAIL_PASS` | auth | secret `mail-api-secret-pass` | Password of the sending mailbox |
| `TWILIO_AUTH_TOKEN` | notification | secret `twilio-auth-token` | Twilio auth token |
| `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY` | auth | manifest | Cloudinary account |
| `MAIL_USER`, `MAIL_SERVER_PORT` | auth | manifest | Sending mailbox and SMTP port |
| `RESET_PASSWORD_EXPIRATION_KEY` | auth | manifest | Lifetime of a password reset code, in milliseconds |
| `PORT` | auth | manifest | Required at start-up; the service listens on 3000 |
| `TWILIO_ACCOUNT_SID`, `TWILIO_PHONE_NUMBER` | notification | manifest | Twilio account and sender number |
| `REDIS_HOST` | notification | manifest | Redis host for Bull |
| `MONGO_URI` | auth, appointment | manifest | Connection string of the service's own MongoDB |
| `NATS_URL`, `NATS_CLUSTER_ID`, `NATS_CLIENT_ID` | all services | manifest (client id is the pod name) | NATS Streaming connection |

## API Overview

Resources are addressed with query parameters. "Any" means any signed-in user.

### Auth (`/api/auth`)

| Method | Path | Purpose | Role |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Register (multipart, optional `picture`); e-mails an activation key | Public |
| POST | `/api/auth/signin` | Sign in | Public |
| POST | `/api/auth/signOut` | Clear the session | Public |
| GET | `/api/auth/current-user` | Return the current session user | Optional |
| PATCH | `/api/auth/active` | Activate the account with `activeKey` | Any |
| PATCH | `/api/auth/resend?email=&service=` | Re-send the activation key or reset code | Public |
| PATCH | `/api/auth/forget` | E-mail a password reset code | Public |
| POST | `/api/auth/key?email=` | Validate a reset code | Public |
| PATCH | `/api/auth/reset?email=` | Set a new password | Public |
| PATCH | `/api/auth/user` | Update profile, e-mail, password or picture | Any |
| DELETE | `/api/auth/user` | Delete own account | Any |
| GET | `/api/auth/doctors` | List doctors | Any |

### Appointment (`/api/appointment`)

| Method | Path | Purpose | Role |
| --- | --- | --- | --- |
| POST | `/api/appointment/patient/book?doctorId=` | Request an appointment with a doctor (`description`) | Patient |
| GET | `/api/appointments/patient/show` | List own appointments | Patient |
| GET | `/api/appointment/patient?id=` | Get one appointment | Patient |
| PATCH | `/api/appointment/patient/reschedule?appointmentId=` | Flag an appointment for rescheduling | Patient |
| PATCH | `/api/appointment?id=` | Cancel an appointment | Any |
| POST | `/api/appointment/doctor/available` | Publish an availability slot (`date`, `start_time`, `end_time`) | Doctor |
| PATCH | `/api/appointment/doctor/approved?appointmentId=&patientId=` | Approve an appointment and trigger the SMS reminder | Doctor |
| PATCH | `/api/appointment/doctor/cancelled?appointmentId=` | Cancel an appointment | Doctor |
| PATCH | `/api/appointment/doctor/finished?appointmentId=` | Mark an appointment as finished | Doctor |
| GET | `/api/appointment/show-available?doctorId=` | List a doctor's availability slots (`doctorId` required for patients and admins) | Any |
| GET | `/api/appointments?doctorId=` | List a doctor's appointments (`doctorId` required for admins) | Doctor, Admin |
| GET | `/api/appointment/upcoming?doctorId=` | Upcoming appointments | Doctor, Admin |
| GET | `/api/appointment/previous?doctorId=` | Past appointments | Doctor, Admin |
| GET | `/api/appointments/filter?doctorId=&patientId=&status=` | Filter appointments by patient, status and date | Doctor, Admin |
| POST | `/api/appointment/admin/book?doctorId=&patientId=` | Book an appointment on behalf of a patient | Admin |
| PATCH | `/api/appointment/admin/update-book?appointmentId=` | Edit a booking and reset it to `reserved` | Admin |
| PATCH | `/api/appointment/admin/available?appointmentId=&doctorId=` | Edit a doctor's availability slot | Admin |
| PATCH | `/api/appointment/admin/approved?appointmentId=&patientId=` | Approve an appointment and trigger the SMS reminder | Admin |
| PATCH | `/api/appointment/admin/cancelled?appointmentId=` | Cancel an appointment | Admin |
| PATCH | `/api/appointment/admin/finished?appointmentId=` | Mark an appointment as finished | Admin |
| PATCH | `/api/appointment/admin/missed?appointmentId=` | Mark an appointment as missed | Admin |
| GET | `/api/appointment/admin/schedule?doctorId=` | A doctor's appointments that have no date yet | Admin |
| GET | `/api/appointment/admin/reschedule?doctorId=` | A doctor's appointments flagged for rescheduling | Admin |
| DELETE | `/api/appointment/admin/delete?appointmentId=` | Delete a patient appointment | Admin |

Appointment statuses are `reserved`, `approved`, `cancelled`, `finished` and `missed`; each status change records the id of the user who made it.

## Project Status / Known gaps

The project was built in early 2022 as a portfolio piece and is not production-ready. The event flows between the three services are implemented; the items below are known gaps.

- No automated tests yet. Planned: Jest and Supertest with an in-memory MongoDB and a mocked NATS client.
- `POST /api/appointment/admin/book` has an inverted `doctorId` check and currently rejects every request.
- The doctor `cancelled` and `finished` routes validate the wrong query parameter (`id` instead of `appointmentId`).
- Sign-up with a picture reads the wrong upload field (`profilePicture` instead of `picture`).
- `PATCH /api/auth/reset` does not re-check the reset code validated by `/api/auth/key`, and the patient cancel route does not check that the appointment belongs to the caller.
- Permission failures are returned as 400 rather than 403; role checks are repeated in each route instead of a shared middleware.
- The replica lookup in the `user:updated` listener queries on `id` rather than `_id` and should be reviewed.
- Twilio, mail and Cloudinary account values are plain manifest values and should move to secrets or a config map; request validation and pagination are missing.
- NATS Streaming is deprecated upstream; a migration to NATS JetStream is the natural next step.

---

Built by [Muhammed Mustafa](https://github.com/muhamed-mustafa).
