import express, { Request , Response } from "express";
import { User } from "../models/user.model";
import nodemailer , { TransportOptions } from "nodemailer";
import { BadRequestError , upload } from "@clinic-microservices14/common";
import { randomBytes } from "crypto";
import { UserUpdatedPublisher } from "../events/publishers/user-updated-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

router.patch("/api/auth/forget", upload.none(), async (req: Request, res: Response) => 
{
    const user = await User.findOne({ email : req.body.email });
    if (!user) 
    {
        throw new BadRequestError("Invalid Email");
    }
    
    const resetPasswordToken = randomBytes(8).toString("hex");
    let transport = nodemailer.createTransport({
        host : "smtp.gmail.com",
        port : process.env.MAIL_SERVER_PORT,
        secure : true,
        auth :  
        {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
        tls :
        {
            rejectUnauthorized : true
        },

    } as TransportOptions);

    const message = {
        from: '"Clinic-Microservices Support" <no-reply@Clinic-Microservices>',
        to: user.email,
        subject: "Clinic-Microservices Support",
        html: `
                <div style="text-align: center;  font-family: sans-serif">
                    <img src="https://images.unsplash.com/photo-1562577309-4932fdd64cd1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80" alt="Clinic-Microservices" style="width: 250px">
                    <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">
                        <h2>${user.username}</h2>
                        <p style="font-size: 16px">
                            Reset Password Code
                        </p>
                        <p style="color: #FFFFFF; text-decoration: none; background: #041438; padding: 15px 0; display: block; width: 170px; margin: auto; text-transform: Capitalize; font-size: 18px; font-weight: bold" href="">${resetPasswordToken}</p>
                    </div>
                    <div style="margin: 20px; background: transparent; color: #041438">
                        <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                            <a  style="color: #041438; text-transform: uppercase;" href="/help" target="_blank">contact us</a>
                        </p>
                        <p style="margin: 20px 0; direction: ltr">&copy; 2022 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">BetaAI Technical Team</a>, All rights reserved</p>
                  </div>
            `,
    };

    transport.verify((error) => 
    {
        if (error)
        {
          console.log(error);
        } 

        else 
        {
            console.log("server is ready to send email");
        }
    });

    await transport.sendMail(message, async (err) => 
    {
        if(err)
        {
            console.log(err);
            throw new BadRequestError("Forgot Password Message Not Sent");
        } 
         
        else
        {
                user.resetPasswordToken = resetPasswordToken;
                const time = Date.now() + Number(process.env.RESET_PASSWORD_EXPIRATION_KEY);
                user.resetPasswordExpires = new Date(time).toISOString();
                const userData = await user.save();
                if(userData)
                {
                    await new UserUpdatedPublisher(natsWrapper.client).publish({
                        id : userData.id,
                        version : userData.version
                    });
                }

                res.status(200).send({ status: 200, user, message: "Email Sent Successfully", success: true });
        }
    });
});

export { router as forgetPasswordRouter };