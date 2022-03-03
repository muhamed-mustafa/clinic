import express , { Request, Response } from "express";
import { requireAuth , BadRequestError , RolesType } from "@clinic-microservices14/common";
import { User } from "../../models/user.model";

const router = express.Router();

router.get("/api/auth/doctors", requireAuth, async (req: Request, res: Response) =>
{
    // const user = await User.findById(req.currentUser!.id);
    // if(!user || user.role === RolesType.Patient)
    // {
    //     throw new BadRequestError("you don't have permission to show doctors")
    // }

    const doctors = await User.find({ role : RolesType.Doctor });

    if(doctors.length === 0) 
    {
        throw new BadRequestError("Doctors Not Found");
    }

    res.status(200).send({ status : 200 , doctors , success : true });
});

export { router as showAllADoctors };