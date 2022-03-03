import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { GenderType , RolesType } from '@clinic-microservices14/common';

interface UserAttrs 
{
    id : string;
    username : string;
    email : string;
    gender : GenderType;
    picture : string;
    age : number;
    phone : string;
    specialization? : string;
    role : RolesType;
    version : number;
};
 
interface UserDoc extends mongoose.Document
{
    email : string;
    username : string;
    gender : GenderType;
    picture : string;
    age : number;
    phone : string;
    specialization? : string;
    availableDates : string[];
    role : RolesType;
    version : number;
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
        type : String,
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
    
} , { toJSON : { transform(doc , ret) { ret.id = ret._id , delete ret._id , delete ret.password; 
    if(ret.availableDates.length === 0)
    {
        delete ret.availableDates;
    }}
    } ,
    timestamps : { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.set('versionKey' , 'version');
userSchema.plugin(updateIfCurrentPlugin);

userSchema.statics.build = (attrs : UserAttrs) =>
{
    return new User({ _id : attrs.id , ...attrs });
}

const User = mongoose.model<UserDoc , UserModel>('User' , userSchema);

export { User };
