import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { 
    cloudinary_api_key, 
    cloudinary_api_secret_key, 
    cloudinary_name 
} from '../constans.js';

cloudinary.config({ 
    cloud_name: cloudinary_name, 
    api_key: cloudinary_api_key, 
    api_secret: cloudinary_api_secret_key // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (filePath, folder , public_id)=>{
    try {
        if(!filePath) {
            return null
        };
        const res = await cloudinary.uploader.upload(filePath,{folder, public_id, resource_type: 'image'})
        fs.unlinkSync(filePath);
        return res;
    } catch (error) {
        fs.unlinkSync(filePath);
        return null;
    }
};

export {uploadOnCloudinary}