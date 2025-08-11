import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import * as Minio from 'minio';

const storageType = process.env.STORAGE_TYPE || 's3'; // 's3' or 'minio'
const bucketName = process.env.STORAGE_BUCKET || 'chatpdf-bucket';

let s3;
let minio;

if (storageType === 's3') {
    s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
} else {
    minio = new Minio.Client({
        endPoint: 'minio',
        port: 9000,
        useSSL: false,
        accessKey: 'minioadmin',
        secretKey: 'minioadmin'
    });
}

async function uploadFile(key, buffer, size) {
    if (storageType === 'minio') {
        return await minio.putObject(bucketName, key, buffer, size);
    } else {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
        });
        return await s3.send(command);
    }
}

async function getFile(key) {
    if (storageType === 'minio') {
        return await minio.getObject(bucketName, key);
    } else {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        const response = await s3.send(command);
        return response.Body;
    }
}

export { uploadFile, getFile, storageType };