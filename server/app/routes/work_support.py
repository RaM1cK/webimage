import base64
import json
from flask import current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..models import Work
from ..services.storage import build_key, delete_object, download_bytes, presigned_get_url, upload_bytes


def current_user_id():
    return int(get_jwt_identity())


def get_owned_work(work_id):
    work = Work.query.get(work_id)
    if not work or work.user_id != current_user_id():
        return None
    return work


def _inline_work_content(work, data, content_type):
    if work.work_type == "raster":
        mime = content_type or "application/octet-stream"
        encoded = base64.b64encode(data).decode("ascii")
        return f"data:{mime};base64,{encoded}"

    try:
        return data.decode("utf-8")
    except Exception:
        current_app.logger.exception("Failed to decode work content as UTF-8 for work_id=%s", work.id)
        return None


def serialize_work(work, include_inline_content=False):
    item = work.to_dict()
    if not work.file_key:
        return item

    try:
        item["fileUrl"] = presigned_get_url(work.file_key)
    except Exception:
        current_app.logger.exception("Failed to generate presigned URL for work_id=%s", work.id)
        item["fileUrl"] = None

    if include_inline_content:
        try:
            data, content_type = download_bytes(work.file_key)
            content = _inline_work_content(work, data, content_type)
            if content is not None:
                item["content"] = content
        except Exception:
            current_app.logger.exception(
                "Failed to download work content for work_id=%s (type=%s, key=%s)",
                work.id,
                work.work_type,
                work.file_key,
            )

    return item


def parse_work_payload():
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        form = request.form
        return {
            "title": form.get("title"),
            "work_type": form.get("workType"),
            "file": request.files.get("file"),
            "metadata": form.get("metadata"),
            "content": form.get("content"),
            "content_type": form.get("contentType"),
            "is_multipart": True,
        }

    data = request.get_json(silent=True) or {}
    return {
        "title": data.get("title"),
        "work_type": data.get("workType"),
        "file": None,
        "metadata": data.get("metadata"),
        "content": data.get("content"),
        "content_type": data.get("contentType"),
        "is_multipart": False,
    }


def normalize_metadata(metadata):
    if metadata is None:
        return None
    if isinstance(metadata, str):
        return metadata
    return json.dumps(metadata)


def default_content_type_for_work(work_type):
    if work_type == "svg":
        return "image/svg+xml"
    if work_type == "3d":
        return "application/json"
    return "application/octet-stream"


def replace_work_file(work, file_storage):
    if work.file_key:
        delete_object(work.file_key)

    key = build_key(work.user_id, work.work_type, file_storage.filename)
    data = file_storage.read()
    upload_bytes(data, key, file_storage.content_type or "application/octet-stream")
    work.file_key = key


def save_inline_content(work, content, content_type=None):
    raw = content.encode("utf-8") if isinstance(content, str) else content
    ext = ".svg" if work.work_type == "svg" else (".json" if work.work_type == "3d" else ".png")

    if not work.file_key:
        work.file_key = build_key(work.user_id, work.work_type, f"work{ext}")

    upload_bytes(raw, work.file_key, content_type or default_content_type_for_work(work.work_type))
