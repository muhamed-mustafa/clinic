import express , { Request , Response } from 'express';
import { Appointment } from '../models/appointment.model';
import { requireAuth , BadRequestError , RolesType } from '@clinic-microservices14/common';
import { User } from '../models/user.model';
import mongoose from 'mongoose';
import _ from 'lodash';

const router = express.Router();

router.get('/api/appointments/filter' , requireAuth , async (req : Request , res : Response) =>
{
    const user = await User.findById(req.currentUser!.id);
    
    if (!user || user.role === RolesType.Patient) 
    {
        throw new BadRequestError("You don't have this permission");
    }
    
    const query : { [key: string]: any; } = 
    {
        date : req.body.date,
        patient : req.query.patientId,
        "dataStatus.status" : req.query.status ? String(req.query.status).toLowerCase() : undefined,
    };

    _.each(query, (value, key) => {
        if (_.isUndefined(value)) {
            delete query[key];
        }
    });

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

        appointments = await Appointment.find({ 
          doctor  : doctor.id, 
          ...query
        });
    }

    else
    {
        appointments = await Appointment.find({ 
          doctor  : user.id, 
          ...query
        });
    }
  
    appointments = appointments.filter(appointment => !appointment.end_time);

    if(appointments.length === 0)
    {
        throw new BadRequestError('there is no appointments...');
    }

    res.status(200).send({ status : 200 , appointments , success : true });
});

export { router as filterAppointments };