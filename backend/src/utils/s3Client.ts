import AWS from 'aws-sdk';

// Configurar AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

/**
 * Subir un archivo a Amazon S3
 * @param fileBuffer Buffer del archivo a subir
 * @param fileName Nombre del archivo (ej: certificate_xxxxx.pdf)
 * @param contentType Tipo MIME del archivo (ej: application/pdf)
 * @returns URL pública del archivo
 */
export const uploadToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string = 'application/pdf'
): Promise<string> => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || 'istpet-eventos-uploads',
      Key: `uploads/${Date.now()}-${fileName}`,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read' // Hacer el archivo públicamente accesible
    };

    const result = await s3.upload(params).promise();
    return result.Location; // URL pública del archivo
  } catch (error: any) {
    console.error('Error subiendo archivo a S3:', error);
    throw new Error(`Error al subir archivo a S3: ${error.message}`);
  }
};

/**
 * Eliminar un archivo de Amazon S3
 * @param fileKey Clave del archivo en S3 (ej: uploads/1234567-certificate.pdf)
 */
export const deleteFromS3 = async (fileKey: string): Promise<void> => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || 'istpet-eventos-uploads',
      Key: fileKey
    };

    await s3.deleteObject(params).promise();
  } catch (error: any) {
    console.error('Error eliminando archivo de S3:', error);
    throw new Error(`Error al eliminar archivo de S3: ${error.message}`);
  }
};

export default s3;
