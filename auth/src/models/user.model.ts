import { Password } from "../services/Password";
import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { GenderType , RolesType } from '@clinic-microservices14/common';

interface UserAttrs 
{
    username : string;
    email : string;
    password : string;
    gender : GenderType;
    picture? : string;
    age : number;
    phone : string;
    specialization? : string;
    role : RolesType;
    macAddress : { Mac : string }[];
    activeKey? : string;
};
 
interface UserDoc extends mongoose.Document
{
    email : string;
    username : string;
    password : string;
    gender : GenderType;
    picture : string;
    age : number;
    phone : string;
    specialization : string;
    availableDates : string[];
    role : RolesType;
    version : number;
    macAddress : { Mac : string }[];
    activeKey : string;
    active : boolean;
    resetPasswordToken : string;
    resetPasswordExpires : string;
    createdAt : string;
    updatedAt : string;
};

interface UserModel extends mongoose.Model<UserDoc>
{
    build(attrs : UserAttrs) : UserDoc;
}

const userSchema = new mongoose.Schema({
    username :
    {
        type : String,
        required : true,
        trim : true,
        unique : true,
        minlength : [8 , "Username must be more than 8 characters"],
        max : 20,
        lowercase : true
    },

    email :
    {
        type : String,
        required : true,
        trim : true,
        unique : true,
        max : 50,
        lowercase : true
    },

    password :
    {
        type : String,
        required : true,
        minlength : [8 , "Password must be more than 8 characters"]
    },

    gender :
    {            
        type : String,
        required : true,
        trim : true,
        lowercase : true,
        enum : Object.values(GenderType),
    },

    picture :
    {
        type : String,
    },

    age :
    {
        type : Number,
        required : true,
        trim : true,
        min : 15
    },

    phone :
    {
        type : Number,
        required : [true , 'phone number is required'],
        trim : true
    },

    specialization : 
    {
      type: String,
      trim: true,
    },

    availableDates :
    {
        type : Array,
        default : []
    },

    role :
    {
        type: String,
        required: true,
        enum: Object.values(RolesType),
    },
      
    macAddress :
    {
        type : Array
    },

    activeKey :
    {
        type : String
    },

    active :
    {
        type    : Boolean ,
        default : false 
    },

    resetPasswordToken :
    {
        type : String ,
    }, 

    resetPasswordExpires : 
    {
        type : Date ,
    },

} , { toJSON : { transform(doc , ret) { ret.id = ret._id , delete ret._id , delete ret.password; 
    if(ret.availableDates.length === 0)
    {
        delete ret.availableDates;
    }}
    } ,
    timestamps : { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.set('versionKey' , 'version');
userSchema.plugin(updateIfCurrentPlugin);

userSchema.pre('save' , async function(done)
{
    if(this.isModified('password'))
    {
        const hashed = await Password.toHash(this.get('password'));
        this.set('password' , hashed);
    };

    done();
});

userSchema.statics.build = (attrs : UserAttrs) =>
{
    return new User(attrs);
}

const User = mongoose.model<UserDoc , UserModel>('User' , userSchema);

export { User };
