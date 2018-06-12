const mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    first_name: {type:String, required:[true, "First name is required"]},
    last_name: {type:String, required:[true, "Last name is required"]},
    phone: {type:Number, required:[true, "Phone number is required"]},
    email: {type:String, required:[true, "Email is required"]},
    password: {type:String, required:[true, "Password is required"]},
    location: [{
        pickup: {type:String, required:true},
        dropoff: {type:String, required:true}
    }]
}, {timestamps:true});

const User = mongoose.model('User', UserSchema);