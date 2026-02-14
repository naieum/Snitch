import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// VULN [Cat 11]: Hardcoded AWS credentials
// VULN [Cat 11]: Overly permissive IAM policy (s3:* on *)
const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

let s3Client: S3Client | null = null;

export function getS3(): S3Client {
  if (!s3Client) {
    try {
      s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
          accessKeyId: AWS_KEY,
          secretAccessKey: AWS_SECRET,
        },
      });
    } catch {
      console.warn("AWS S3 initialization failed");
      return {} as S3Client;
    }
  }
  return s3Client;
}

// VULN [Cat 11]: Wildcard IAM - accepts any bucket/key
export async function uploadFile(bucket: string, key: string, body: Buffer) {
  try {
    const client = getS3();
    return await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body })
    );
  } catch {
    console.warn("S3 upload failed - service unavailable");
    return null;
  }
}
