import express , { Request , Response } from 'express';
import { Appointment } from '../../models/appointment.model';
import { requireAuth , BadRequestError , RolesType } from '@clinic-microservices14/common';
import { User } from '../../models/user.model';

const router = express.Router();

router.get('/api/appointments/patient/show' , requireAuth , async (req : Request , res : Response) =>
{
    const patient = await User.findById(req.currentUser!.id);

    if (!patient || patient.role !== RolesType.Patient) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    const appointments = await Appointment.find({ patient : patient.id });

    if(appointments.length === 0)
    {
        throw new BadRequestError('there is no appointments...');
    }

    res.status(200).send({ status : 200 , appointments , success : true });
});

export { router as showAllAppointments };


