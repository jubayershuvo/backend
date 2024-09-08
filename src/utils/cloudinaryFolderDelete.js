import { v2 as cloudinary } from 'cloudinary';
const deleteCloudinaryFolder = (folder)=>{

    try {
        async function deleteFolder() {
            console.log(folder)
            await cloudinary.api.delete_folder(folder);
        }
        deleteFolder();
        return true;
    } catch (error) {
        return false;
    }

}

export default deleteCloudinaryFolder;