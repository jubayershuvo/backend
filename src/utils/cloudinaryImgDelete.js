import { v2 as cloudinary } from 'cloudinary';
const deleteCloudinaryImg = (imgUrl)=>{

    try {
        async function deleteImg() {
            const imgUrlArry = imgUrl.split('/')[imgUrl.split('/').length-1].split('.');
            const imgPublicId = imgUrlArry[0];
            await cloudinary.uploader.destroy(imgPublicId);
        }
        deleteImg();
        return true;
    } catch (error) {
        return false;
    }

}

export default deleteCloudinaryImg;