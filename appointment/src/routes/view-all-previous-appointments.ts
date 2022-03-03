import express , { Request , Response } from 'express';
import { Appointment } from '../models/appointment.model';
import { requireAuth , BadRequestError , RolesType } from '@clinic-microservices14/common';
import { User } from '../models/user.model';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/api/appointment/previous' , requireAuth , async (req : Request , res : Response) =>
{
    const user = await User.findById(req.currentUser!.id);

    if (!user || user.role === RolesType.Patient) 
    {
        throw new BadRequestError("You don't have this permission");
    }

    let appointments;
    if(user.role === RolesType.Admin)
    {
        if(!req.query.doctorId || !mongoose.Types.ObjectId.isValid(String(req.query.doctorId)))
        {
            throw new BadRequestError('Id Is Invalid')
        }

        const doctor = await User.findById(req.query.doctorId);
        if(!doctor)
        {
            throw new BadRequestError('doctor not found')
        }

        appointments = await Appointment.find({ doctor : doctor.id });
    }

    else
    {
        appointments = await Appointment.find({ doctor : user.id });
    }

    appointments = appointments.filter(appointment => !appointment.end_time);

    if(appointments.length === 0)
    {
        throw new BadRequestError('there is no appointments...');
    }

    const filteredAppointments = appointments.filter(appointment => { return new Date(appointment.date) < new Date() });

    res.status(200).send({ status : 200 , filteredAppointments , success : true });
});

export { router as showAllPreviousAppointments };