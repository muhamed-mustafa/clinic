import express , { Request , Response } from 'express';
import jwt from 'jsonwebtoken';
import address from 'address';
import { upload , validationPhoto , BadRequestError  , validateUserSignUpData , GenderType , PictureType } from '@clinic-microservices14/common';
import { v2 as Cloudinary } from 'cloudinary';
import { User } from '../models/user.model';
import nodemailer , { TransportOptions } from 'nodemailer';
import { randomBytes } from 'crypto';
import { UserCreatedPublisher } from '../events/publishers/user-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post('/api/auth/signup' , upload.fields([{ name : "picture" , maxCount : 1}]) , validationPhoto  , validateUserSignUpData , async (req : Request , res : Response) =>
{
        const files = req.files as {[fieldname : string] : Express.Multer.File[]};
        
        const { email , username } = req.body;
        const existingUser = await User.findOne({ email });
        
        if(existingUser)
        {
            throw new BadRequestError('Email in use!');
        }

        const existUsername = await User.findOne({ username });
        if(existUsername)
        {
            throw new BadRequestError('Username is already exists.');
        }

        let user = User.build({ ...req.body });

        if(files.picture)
        {
            await new Promise((resolve , reject) =>
            {
                Cloudinary.uploader.upload_stream({
                    public_id : `picture/Clinic-${user.username}`,
                    use_filename : true,
                    tags : `${user.username}-tag`,
                    width : 500,
                    height : 500,
                    crop : "scale",
                    placeholder : true,
                    resource_type : 'auto'
                } , async(err , result) =>
                {
                    if(err)
                    {
                        console.log(err);
                        reject(err);
                    }

                    else
                    {
                        user.picture = result?.secure_url!;
                        resolve(user!.picture)
                    }   
                }).end(files.profilePicture[0].buffer);
            });
        }

        else
        {
                if (user.gender === GenderType.Male) 
                {
                    user.picture = PictureType.Male;
                } 
                
                else 
                {
                    user.picture = PictureType.Female;
                }
        }

        address.mac((err , addr) =>
        {
            if(err)
            {
                console.log(err);
            }

            return user.macAddress.push({ Mac : addr });
        }); 

        // generate JWT and then store it on session object
        const userJwt = jwt.sign({ id : user.id , email : user.email} , process.env.JWT_KEY!);
        req.session   = { jwt : userJwt };
        
        let activeKey = randomBytes(8).toString('hex');
        let transport = await nodemailer.createTransport({
           host : "smtp.gmail.com",
           port : process.env.MAIL_SERVER_PORT,
           secure : true,
           auth :   
           {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
           },
           tls  :
           {
               rejectUnauthorized : true
           }
        } as TransportOptions);

        const message = 
        {
            from : 'Clinic-Microservices Support" <no-reply@Clinic-microservices>',
            to : user.email,
            subject : "Clinic-Microservices Support",
            html: `
                        <div style="text-align: center;  font-family: sans-serif">
                            <img src="https://images.unsplash.com/photo-1562577309-4932fdd64cd1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80" alt="Clinic-Microservices" style="width: 250px">
                            <div style="text-align: center; margin: auto; padding: 20px; background: #FFFFFF; color: #041438">
                                <h1 style="direction: ltr">Just one more step...</h1>
                                <h2>${user.username}</h2>
                                <p style="font-size: 16px">
                                 activate your Clinic-Microservices account 
                                </p>
                                <p style="color: #FFFFFF; text-decoration: none; background: #041438; padding: 15px 0; display: block; width: 170px; margin: auto; text-transform: Capitalize; font-size: 18px; font-weight: bold">${activeKey}</p>
                            </div>
                            <div style="margin: 20px; background: transparent; color: #041438">
                                <p style="font-size: 14px; direction: ltr">If you think something is wrong please
                                    <a  style="color: #041438; text-transform: uppercase;" href="" target="_blank">contact us</a>
                                </p>
                                <p style="margin: 20px 0; direction: ltr">&copy; 2022 - <a style="color: #041438; direction: ltr" href="mailto:techno@beta.ai">Clinic-Microservices Technical Team</a>, All rights reserved</p>
                          </div>
                    `,
        };

        transport.verify((err) =>
        {
            if(err)
            {
                console.error(err);
            }

            else
            {
                console.log("server is ready to send email");
            }
        });

        // sending mail
        await transport.sendMail(message , async(err) =>
        {
            if(err)
            {
                console.log(err);
                throw new BadRequestError("Account was created but the activation email not sent");
            }

            else
            {
                user.activeKey = activeKey;
                const userData = await user.save();
                if(userData)
                {
                    await new UserCreatedPublisher(natsWrapper.client).publish({
                        id : userData.id,
                        username : userData.username,
                        email : userData.email,
                        role : userData.role,
                        age : userData.age,
                        phone : userData.phone,
                        gender : userData.gender,
                        picture : userData.picture,
                        specialization : userData.specialization,
                        version : userData.version
                    })
                }

                res.status(201).send({ status : 201 , user , success : true})
            }
        });
});

export { router as signUpRouter };