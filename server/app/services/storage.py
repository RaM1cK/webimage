import logging
import os
import uuid

import boto3
from botocore.client import Config as BotoConfig
from flask import current_app

logger = logging.getLogger(__name__)


def _s3_config():
    return current_app.config


def _bucket_name():
    return _s3_config()["S3_BUCKET"]


def _boto_client(endpoint_url=None):
    config = _s3_config()
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url or config.get("S3_ENDPOINT_URL"),
        aws_access_key_id=config.get("S3_ACCESS_KEY"),
        aws_secret_access_key=config.get("S3_SECRET_KEY"),
        region_name=config.get("S3_REGION", "us-east-1"),
        config=BotoConfig(signature_version="s3v4", s3={"addressing_style": "path"}),
        use_ssl=config.get("S3_USE_SSL", False),
    )


def get_s3_client():
    return _boto_client()


def _allowed_cors_origins():
    client_origin = (_s3_config().get("CLIENT_ORIGIN") or "http://localhost:3000").rstrip("/")
    return sorted({client_origin, "http://localhost:3000", "http://127.0.0.1:3000"})


def ensure_bucket():
    client = get_s3_client()
    bucket = _bucket_name()

    try:
        client.head_bucket(Bucket=bucket)
    except Exception:
        try:
            client.create_bucket(Bucket=bucket)
        except Exception:
            logger.exception("Failed to ensure S3 bucket '%s'", bucket)

    try:
        client.put_bucket_cors(
            Bucket=bucket,
            CORSConfiguration={
                "CORSRules": [
                    {
                        "AllowedHeaders": ["*"],
                        "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
                        "AllowedOrigins": _allowed_cors_origins(),
                        "ExposeHeaders": ["ETag", "Content-Type", "Content-Length"],
                        "MaxAgeSeconds": 3000,
                    }
                ]
            },
        )
    except Exception:
        logger.exception("Failed to set CORS configuration for S3 bucket '%s'", bucket)


def build_key(user_id, work_type, filename):
    ext = os.path.splitext(filename or "")[1] or ""
    return f"users/{user_id}/{work_type}/{uuid.uuid4().hex}{ext}"


def upload_bytes(data, key, content_type="application/octet-stream"):
    client = get_s3_client()
    client.put_object(Bucket=_bucket_name(), Key=key, Body=data, ContentType=content_type)
    return key


def upload_fileobj(fileobj, key, content_type=None):
    client = get_s3_client()
    extra = {"ContentType": content_type} if content_type else {}
    client.upload_fileobj(fileobj, _bucket_name(), key, ExtraArgs=extra)
    return key


def download_bytes(key):
    client = get_s3_client()
    obj = client.get_object(Bucket=_bucket_name(), Key=key)
    return obj["Body"].read(), obj.get("ContentType", "application/octet-stream")


def delete_object(key):
    if not key:
        return
    client = get_s3_client()
    bucket = _bucket_name()
    try:
        client.delete_object(Bucket=bucket, Key=key)
    except Exception:
        logger.exception("Failed to delete S3 object (bucket=%s, key=%s)", bucket, key)


def presigned_get_url(key, expires=3600):
    bucket = _bucket_name()
    endpoint = _s3_config().get("S3_PUBLIC_ENDPOINT_URL") or _s3_config().get("S3_ENDPOINT_URL")
    public_client = _boto_client(endpoint_url=endpoint)
    return public_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires,
    )
