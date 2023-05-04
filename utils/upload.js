const ErrorResponse = require("./errorResponse");
const sharp = require("sharp");
const fs = require("fs");

async function uploadProfilePicture(req, res, next, userId){
    let profilePhotoName = 'profilePicture.png'
    let profilePhotoPath = `./media/users/${userId}`;

    // Check if any file was uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorResponse('No file uploaded', 400));
    }

    //Check if user have already a profile picture
    // let userPhoto = await checkIfFileExists(profilePhotoPath, profilePhotoName);

    //Create User directory if doesn't exist
    await createUserDirectory(next, profilePhotoPath);

    //Compress the image and upload it
    const buffer = req.files['photo']['data'];
    await compressImage(req, res, next, buffer, `${profilePhotoPath}/${profilePhotoName}`)

    return `${profilePhotoPath}/${profilePhotoName}`
}

async function createUserDirectory(next, path){
    // Create the directory for the upload if it doesn't exist
    fs.mkdir(path, function(err) {
        if (err && err.code !== 'EEXIST') {
            return next(new ErrorResponse('There is a problem with upload directory', 500));
        }
    });
}
async function compressImage(req, res, next, buffer, fullPath){
    // Compress and save the image
    return await sharp(buffer).webp({ quality: 40 }).toFile(fullPath).catch(err => {
        return next(new ErrorResponse('There is a problem at compressing the image', 500));
    })
}

async function checkIfFileExists(directory, fileName) {
    try {
        const files = await getFilesInDirectory(directory);
        if (files.includes(fileName)) {
            return fileName;
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}
function getFilesInDirectory(dir) {
    try {
        // Read the contents of the directory
        const files = fs.readdirSync(dir);

        // Filter out directories and return only file names
        return files.filter(file => {
            const fullPath = `${dir}/${file}`;
            return fs.statSync(fullPath).isFile();
        });
    } catch (err) {
        console.error(err);
        return [];
    }
}

module.exports = {
    uploadProfilePicture: uploadProfilePicture
};