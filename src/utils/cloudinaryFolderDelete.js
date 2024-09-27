import { v2 as cloudinary } from 'cloudinary';
const deleteCloudinaryFolder = (folder)=>{

    try {
        async function deleteFolder() {
            await cloudinary.api.delete_resources_by_prefix(`Users_images/${folder}/`);
        }
        deleteFolder();
        return true;
    } catch (error) {
        return false;
    }

}

export default deleteCloudinaryFolder;