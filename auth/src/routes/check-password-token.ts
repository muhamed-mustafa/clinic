import express , { Request , Response } from 'express';
import { upload , BadRequestError } from '@clinic-microservices14/common';
import { User } from '../models/user.model';

const router = express.Router();

router.post('/api/auth/key' , upload.none() , async(req : Request , res : Response) =>
{
    const user = await User.findOne({ email : req.query.email });
    if(!user)
    {
        throw new BadRequestError('user is no exist');
    }

    if(req.body.resetPasswordToken)
    {
        if(new Date() > new Date(user.resetPasswordExpires))
        {
           throw new BadRequestError("reset password token Is Expired");
        }

        if(user.resetPasswordToken !== req.body.resetPasswordToken)
        {
            throw new BadRequestError("reset password token Is Invalid");
        }

        res.status(200).send({ status: 200 , user , success: true });
    }

    else
    {
        throw new BadRequestError('reset password token is required');
    }
});

export { router as checkPasswordTokenRouter };